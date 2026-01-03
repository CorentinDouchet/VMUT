package com.mbda.mbdhackuity.util;

import org.springframework.stereotype.Component;
import java.util.*;

@Component
public class VersionComparator {

    public int compare(String v1, String v2) {
        DebianVersion dv1 = parseDebianVersion(v1);
        DebianVersion dv2 = parseDebianVersion(v2);
        
        if (dv1.epoch != dv2.epoch) {
            return Integer.compare(dv1.epoch, dv2.epoch);
        }
        
        int maxLen = Math.max(dv1.segments.size(), dv2.segments.size());
        
        for (int i = 0; i < maxLen; i++) {
            Object s1 = i < dv1.segments.size() ? dv1.segments.get(i) : null;
            Object s2 = i < dv2.segments.size() ? dv2.segments.get(i) : null;
            
            if (s1 == null) return -1;
            if (s2 == null) return 1;
            
            if (s1 instanceof Integer && s2 instanceof Integer) {
                int cmp = Integer.compare((Integer) s1, (Integer) s2);
                if (cmp != 0) return cmp;
            } else {
                int cmp = s1.toString().compareTo(s2.toString());
                if (cmp != 0) return cmp;
            }
        }
        
        return 0;
    }

    public boolean isInRange(String version, String vStartInc, String vStartExc, 
                            String vEndInc, String vEndExc) {
        if (vStartInc != null && compare(version, vStartInc) < 0) return false;
        if (vStartExc != null && compare(version, vStartExc) <= 0) return false;
        if (vEndInc != null && compare(version, vEndInc) > 0) return false;
        if (vEndExc != null && compare(version, vEndExc) >= 0) return false;
        return true;
    }

    private DebianVersion parseDebianVersion(String version) {
        DebianVersion dv = new DebianVersion();
        dv.epoch = 0;
        String upstream = version;
        
        if (version.contains(":")) {
            String[] parts = version.split(":", 2);
            try {
                dv.epoch = Integer.parseInt(parts[0]);
            } catch (NumberFormatException e) {
                dv.epoch = 0;
            }
            upstream = parts[1];
        }
        
        upstream = upstream.split("[-~]")[0];
        
        String[] parts = upstream.split("[._-]");
        for (String part : parts) {
            if (part.isEmpty()) continue;
            try {
                dv.segments.add(Integer.parseInt(part));
            } catch (NumberFormatException e) {
                dv.segments.add(part);
            }
        }
        
        return dv;
    }

    private static class DebianVersion {
        int epoch = 0;
        List<Object> segments = new ArrayList<>();
    }
}