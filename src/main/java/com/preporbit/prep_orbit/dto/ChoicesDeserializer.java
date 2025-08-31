package com.preporbit.prep_orbit.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;
import java.util.ArrayList;

public class ChoicesDeserializer extends JsonDeserializer<String[]> {
    @Override
    public String[] deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonNode node = p.getCodec().readTree(p);
        if (node.isArray()) {
            String[] result = new String[node.size()];
            for (int i = 0; i < node.size(); i++) {
                result[i] = node.get(i).asText();
            }
            return result;
        } else if (node.isTextual()) {
            return node.asText().split("\\s*,\\s*");
        } else if (node.isObject()) {
            String[] keys = {"A", "B", "C", "D"};
            ArrayList<String> result = new ArrayList<>();
            for (String key : keys) {
                if (node.has(key)) {
                    result.add(node.get(key).asText());
                }
            }
            return result.toArray(new String[0]);
        } else {
            throw new IOException("Unable to deserialize choices/options: Unexpected format " + node.toString());
        }
    }
}