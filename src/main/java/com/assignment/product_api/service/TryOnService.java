package com.assignment.product_api.service;

import com.assignment.product_api.entity.Product;
import com.assignment.product_api.entity.TryOnResult;
import com.assignment.product_api.exception.ProductNotFoundException;
import com.assignment.product_api.exception.TryOnException;
import com.assignment.product_api.repository.ProductRepository;
import com.assignment.product_api.repository.TryOnResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Deque;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Makes a photo-real picture of the mannequin wearing the chosen products by
 * sending the mannequin photo and the product photos to the Gemini image API.
 * Results are stored, so the same outfit is only generated once.
 */
@Service
public class TryOnService {

    private static final Logger log = LoggerFactory.getLogger(TryOnService.class);

    // Change this when the prompt changes, so old pictures are not reused
    private static final String PROMPT_VERSION = "v1";
    private static final Set<String> POSES = Set.of("crossed", "hips", "angle");
    private static final String API_BASE =
            "https://generativelanguage.googleapis.com/v1beta/models/";

    private final ProductRepository productRepository;
    private final TryOnResultRepository resultRepository;
    private final RestClient restClient;

    private final String apiKey;
    private final String model;
    private final Path imagesDir;
    private final int maxPerHour;

    // username -> times of recent (uncached) generations
    private final Map<String, Deque<Long>> recent = new ConcurrentHashMap<>();

    public record Result(byte[] image, String mimeType, boolean cached) {
    }

    public TryOnService(
            ProductRepository productRepository,
            TryOnResultRepository resultRepository,
            @Value("${app.tryon.gemini-api-key:}") String apiKey,
            @Value("${app.tryon.model:gemini-2.5-flash-image}") String model,
            @Value("${app.tryon.images-dir:frontend/public}") String imagesDir,
            @Value("${app.tryon.max-per-hour:10}") int maxPerHour) {
        this.productRepository = productRepository;
        this.resultRepository = resultRepository;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
        this.imagesDir = Path.of(imagesDir).toAbsolutePath().normalize();
        this.maxPerHour = maxPerHour;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(120));
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    public Result generate(String username, List<Long> productIds, String pose) {
        String poseId = pose == null || pose.isBlank() ? "crossed" : pose;
        if (!POSES.contains(poseId)) {
            throw new TryOnException(HttpStatus.BAD_REQUEST, "Unknown pose: " + poseId);
        }

        // product id -> photo path (first photo of the product)
        Map<Long, String> photos = new LinkedHashMap<>();
        List<String> names = new ArrayList<>();
        for (Long id : productIds.stream().distinct().sorted().toList()) {
            Product product = productRepository.findById(id)
                    .orElseThrow(() -> new ProductNotFoundException(
                            "Product not found with id " + id));
            String photo = firstPhoto(product.getImageUrl());
            if (photo != null) {
                photos.put(id, photo);
                names.add(product.getName());
            }
        }
        if (photos.isEmpty()) {
            throw new TryOnException(HttpStatus.BAD_REQUEST,
                    "None of the chosen products has a photo to try on.");
        }

        String cacheKey = sha256(PROMPT_VERSION + "|" + model + "|" + poseId + "|" + photos);
        var cached = resultRepository.findByCacheKey(cacheKey);
        if (cached.isPresent()) {
            TryOnResult r = cached.get();
            return new Result(r.getImage(), r.getMimeType(), true);
        }

        if (apiKey.isEmpty()) {
            throw new TryOnException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI try-on is not set up on the server yet. "
                            + "Set the GEMINI_API_KEY environment variable and restart the backend.");
        }
        checkRate(username);

        // The mannequin first, then one photo per product
        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", prompt(names)));
        parts.add(imagePart("/mannequins/pose-" + poseId + ".webp"));
        photos.values().forEach(path -> parts.add(imagePart(path)));

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", parts)),
                "generationConfig", Map.of("responseModalities", List.of("TEXT", "IMAGE"))
        );

        Map<?, ?> response;
        try {
            response = restClient.post()
                    .uri(API_BASE + model + ":generateContent")
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientResponseException e) {
            log.warn("Gemini returned {}: {}", e.getStatusCode().value(), abbreviate(e.getResponseBodyAsString()));
            if (e.getStatusCode().value() == 429) {
                throw new TryOnException(HttpStatus.TOO_MANY_REQUESTS,
                        "The AI service limit was reached (free tier or quota). Try again later.");
            }
            throw new TryOnException(HttpStatus.BAD_GATEWAY,
                    "The AI service refused the request (" + e.getStatusCode().value()
                            + "). Check the API key, the model name and that image output is "
                            + "available for your plan.");
        } catch (RuntimeException e) {
            log.warn("Gemini call failed", e);
            throw new TryOnException(HttpStatus.BAD_GATEWAY,
                    "Could not reach the AI service. Try again in a moment.");
        }

        Map.Entry<String, byte[]> image = extractImage(response);
        resultRepository.save(new TryOnResult(cacheKey, image.getKey(), image.getValue()));
        return new Result(image.getValue(), image.getKey(), false);
    }

    private static String prompt(List<String> names) {
        return "Virtual try-on. The FIRST image is a grey mannequin. The remaining images are "
                + "product photos of: " + String.join(", ", names) + ". "
                + "Dress the mannequin in exactly these garments. Keep the mannequin's pose, "
                + "camera angle, framing and plain white studio background unchanged. "
                + "Every garment must look identical to its product photo (colour, fabric, "
                + "pattern, zips, buttons, ribbing) and fit the body naturally, with realistic "
                + "folds, the jacket or top over the trousers, sleeves hanging along the arms. "
                + "Full body, photorealistic, soft studio lighting. Do not add text, logos or "
                + "people, and do not change the garments.";
    }

    private Map<String, Object> imagePart(String webPath) {
        Path file = resolve(webPath);
        try {
            byte[] bytes = Files.readAllBytes(file);
            return Map.of("inlineData", Map.of(
                    "mimeType", mimeOf(file.getFileName().toString()),
                    "data", Base64.getEncoder().encodeToString(bytes)));
        } catch (IOException e) {
            log.warn("Cannot read {}", file, e);
            throw new TryOnException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "A product photo could not be read on the server.");
        }
    }

    // Only files inside the images folder may be read
    private Path resolve(String webPath) {
        Path file = imagesDir.resolve(webPath.startsWith("/") ? webPath.substring(1) : webPath)
                .normalize();
        if (!file.startsWith(imagesDir) || !Files.isRegularFile(file)) {
            throw new TryOnException(HttpStatus.BAD_REQUEST,
                    "Photo not found on the server: " + webPath);
        }
        return file;
    }

    private static String firstPhoto(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return null;
        }
        String first = imageUrl.split(",")[0].trim();
        return first.startsWith("/") ? first : null;
    }

    private static String mimeOf(String name) {
        String n = name.toLowerCase();
        if (n.endsWith(".png")) return "image/png";
        if (n.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    private static Map.Entry<String, byte[]> extractImage(Map<?, ?> response) {
        String text = null;
        if (response != null && response.get("candidates") instanceof List<?> candidates
                && !candidates.isEmpty() && candidates.get(0) instanceof Map<?, ?> candidate
                && candidate.get("content") instanceof Map<?, ?> content
                && content.get("parts") instanceof List<?> parts) {
            for (Object p : parts) {
                if (!(p instanceof Map<?, ?> part)) continue;
                Object inline = part.get("inlineData") != null ? part.get("inlineData") : part.get("inline_data");
                if (inline instanceof Map<?, ?> data && data.get("data") instanceof String b64) {
                    Object mime = data.get("mimeType") != null ? data.get("mimeType") : data.get("mime_type");
                    return Map.entry(mime instanceof String m ? m : "image/png",
                            Base64.getDecoder().decode(b64));
                }
                if (part.get("text") instanceof String t) {
                    text = t;
                }
            }
        }
        log.warn("Gemini returned no image. Text: {}", abbreviate(text));
        throw new TryOnException(HttpStatus.BAD_GATEWAY,
                "The AI did not return a picture this time. Try again.");
    }

    // At most maxPerHour new pictures per user per hour (stored ones are free)
    private void checkRate(String username) {
        long now = System.currentTimeMillis();
        Deque<Long> times = recent.computeIfAbsent(username, k -> new ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && now - times.peekFirst() > 3_600_000L) {
                times.pollFirst();
            }
            if (times.size() >= maxPerHour) {
                throw new TryOnException(HttpStatus.TOO_MANY_REQUESTS,
                        "You have made " + maxPerHour + " new pictures this hour. Try again later.");
            }
            times.addLast(now);
        }
    }

    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String abbreviate(String s) {
        if (s == null) return "";
        return s.length() > 300 ? s.substring(0, 300) + "..." : s;
    }
}
