package com.assignment.product_api.controller;

import com.assignment.product_api.dto.LookResponse;
import com.assignment.product_api.entity.OutfitLook;
import com.assignment.product_api.service.OutfitLookService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Ready-made realistic outfit pictures.
 * Reading is open to any signed-in user; uploading and deleting are ADMIN only
 * (see SecurityConfig).
 */
@RestController
@RequestMapping("/api/v1/looks")
public class OutfitLookController {

    private final OutfitLookService lookService;

    public OutfitLookController(OutfitLookService lookService) {
        this.lookService = lookService;
    }

    // The picture for exactly these products on this pose, or 404
    @GetMapping("/match")
    public ResponseEntity<byte[]> match(
            @RequestParam("ids") List<Long> ids,
            @RequestParam(value = "pose", defaultValue = "crossed") String pose) {
        return image(lookService.find(ids, pose));
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> image(@PathVariable Long id) {
        return image(lookService.get(id));
    }

    @GetMapping
    public List<LookResponse> list() {
        return lookService.list();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public LookResponse upload(
            @RequestParam("productIds") List<Long> productIds,
            @RequestParam(value = "pose", defaultValue = "crossed") String pose,
            @RequestParam("file") MultipartFile file) {
        return lookService.save(productIds, pose, file);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        lookService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private static ResponseEntity<byte[]> image(OutfitLook look) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(look.getMimeType()))
                .body(look.getImage());
    }
}
