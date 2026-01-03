package com.mbda.mbdhackuity.util;

import org.springframework.stereotype.Component;
import java.util.*;

@Component
public class ProductVariantGenerator {

    private static final Map<String, List<String>> PRODUCT_MAPPINGS = new HashMap<>();
    
    static {
        PRODUCT_MAPPINGS.put("bind9", Arrays.asList("bind", "bind9"));
        PRODUCT_MAPPINGS.put("cups", Arrays.asList("cups", "cups-daemon", "cups-client", "cups-filters"));
        PRODUCT_MAPPINGS.put("curl", Arrays.asList("curl", "libcurl4", "libcurl3", "libcurl"));
        PRODUCT_MAPPINGS.put("openssl", Arrays.asList("openssl", "libssl3", "libssl1.1", "libssl"));
        PRODUCT_MAPPINGS.put("gnutls", Arrays.asList("gnutls", "libgnutls30", "libgnutls28"));
        PRODUCT_MAPPINGS.put("postgresql", Arrays.asList("postgresql", "libpq5", "libpq"));
        PRODUCT_MAPPINGS.put("systemd", Arrays.asList("systemd", "libsystemd0", "libsystemd"));
        PRODUCT_MAPPINGS.put("python3", Arrays.asList("python", "python3", "libpython3"));
        PRODUCT_MAPPINGS.put("git", Arrays.asList("git", "git-core"));
        PRODUCT_MAPPINGS.put("docker-ce", Arrays.asList("docker"));
    }

    public List<String> generateVariants(String packageName) {
        Set<String> variants = new HashSet<>();
        String lower = packageName.toLowerCase();
        
        variants.add(lower);
        
        String withoutLib = lower.replaceFirst("^lib", "");
        if (!withoutLib.equals(lower) && withoutLib.length() > 2) {
            variants.add(withoutLib);
        }
        
        String cleaned = lower.replaceAll("\\d+$", "").replaceAll("t64$", "").replaceAll("g$", "");
        if (!cleaned.equals(lower) && cleaned.length() > 2) {
            variants.add(cleaned);
        }
        
        String[] suffixes = {"-dev", "-common", "-data", "-bin", "-client", "-server", "-utils"};
        for (String suffix : suffixes) {
            if (lower.endsWith(suffix)) {
                String without = lower.substring(0, lower.length() - suffix.length());
                if (without.length() > 2) variants.add(without);
            }
        }
        
        for (Map.Entry<String, List<String>> entry : PRODUCT_MAPPINGS.entrySet()) {
            if (entry.getValue().contains(lower)) {
                variants.add(entry.getKey());
                variants.addAll(entry.getValue());
            }
        }
        
        List<String> temp = new ArrayList<>(variants);
        for (String v : temp) {
            variants.add(v.replace("-", "_"));
            variants.add(v.replace("_", "-"));
        }
        
        return variants.stream()
            .filter(v -> v != null && v.length() > 2)
            .limit(20)
            .toList();
    }
}