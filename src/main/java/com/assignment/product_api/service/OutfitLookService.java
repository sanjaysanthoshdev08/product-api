package com.assignment.product_api.service;

import com.assignment.product_api.dto.LookResponse;
import com.assignment.product_api.entity.OutfitLook;
import com.assignment.product_api.exception.ProductNotFoundException;
import com.assignment.product_api.exception.TryOnException;
import com.assignment.product_api.repository.OutfitLookRepository;
import com.assignment.product_api.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/** Ready-made realistic outfit pictures that an admin uploads. */
@Service
public class OutfitLookService {

    private static final Set<String> POSES = Set.of("crossed", "hips", "angle");
    private static final long MAX_BYTES = 8L * 1024 * 1024;

    private final OutfitLookRepository lookRepository;
    private final ProductRepository productRepository;

    public OutfitLookService(OutfitLookRepository lookRepository,
                             ProductRepository productRepository) {
        this.lookRepository = lookRepository;
        this.productRepository = productRepository;
    }

    // Turns "64, 58" into "58,64" (sorted, distinct) so the same set always matches
    static String keyOf(List<Long> ids) {
        return ids.stream().distinct().sorted().map(String::valueOf)
                .collect(Collectors.joining(","));
    }

    private static String checkPose(String pose) {
        String p = pose == null || pose.isBlank() ? "crossed" : pose;
        if (!POSES.contains(p)) {
            throw new TryOnException(HttpStatus.BAD_REQUEST, "Unknown pose: " + p);
        }
        return p;
    }

    public OutfitLook find(List<Long> ids, String pose) {
        return lookRepository.findByProductKeyAndPose(keyOf(ids), checkPose(pose))
                .orElseThrow(() -> new TryOnException(HttpStatus.NOT_FOUND,
                        "No ready-made picture for this outfit and pose yet."));
    }

    public OutfitLook get(Long id) {
        return lookRepository.findById(id).orElseThrow(() ->
                new TryOnException(HttpStatus.NOT_FOUND, "Look not found."));
    }

    public List<LookResponse> list() {
        return lookRepository.findAll().stream().map(this::toResponse).toList();
    }

    public LookResponse save(List<Long> ids, String pose, MultipartFile file) {
        if (ids == null || ids.isEmpty() || ids.size() > 4) {
            throw new TryOnException(HttpStatus.BAD_REQUEST, "Choose 1 to 4 products.");
        }
        for (Long id : ids) {
            if (!productRepository.existsById(id)) {
                throw new ProductNotFoundException("Product not found with id " + id);
            }
        }
        String poseId = checkPose(pose);

        if (file == null || file.isEmpty()) {
            throw new TryOnException(HttpStatus.BAD_REQUEST, "Choose a picture to upload.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new TryOnException(HttpStatus.BAD_REQUEST, "The picture is larger than 8 MB.");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new TryOnException(HttpStatus.BAD_REQUEST, "The picture could not be read.");
        }
        String mime = sniffMime(bytes);
        if (mime == null) {
            throw new TryOnException(HttpStatus.BAD_REQUEST,
                    "Only JPG, PNG or WebP pictures are allowed.");
        }

        String key = keyOf(ids);
        OutfitLook look = lookRepository.findByProductKeyAndPose(key, poseId).orElse(null);
        if (look == null) {
            look = new OutfitLook(key, poseId, mime, bytes);
        } else {
            look.replaceImage(mime, bytes); // same outfit + pose: replace the old picture
        }
        return toResponse(lookRepository.save(look));
    }

    public void delete(Long id) {
        lookRepository.delete(get(id));
    }

    // The type comes from the file's first bytes, not from its name
    private static String sniffMime(byte[] b) {
        if (b.length > 12) {
            if ((b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8) return "image/jpeg";
            if ((b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') return "image/png";
            if (b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                    && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "image/webp";
        }
        return null;
    }

    private LookResponse toResponse(OutfitLook look) {
        List<Long> ids = Arrays.stream(look.getProductKey().split(","))
                .map(Long::valueOf).toList();
        return new LookResponse(look.getId(), ids, look.getPose(), look.getCreatedAt());
    }
}
