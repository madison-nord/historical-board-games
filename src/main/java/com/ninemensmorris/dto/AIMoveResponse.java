package com.ninemensmorris.dto;

/**
 * Response DTO for the AI move endpoint.
 * Maps the backend Move to a JSON format the frontend can consume.
 */
public class AIMoveResponse {

    private String type;
    private int from;
    private int to;
    private String player;
    private int removed;

    public AIMoveResponse() {
    }

    public AIMoveResponse(String type, int from, int to, String player, int removed) {
        this.type = type;
        this.from = from;
        this.to = to;
        this.player = player;
        this.removed = removed;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getFrom() {
        return from;
    }

    public void setFrom(int from) {
        this.from = from;
    }

    public int getTo() {
        return to;
    }

    public void setTo(int to) {
        this.to = to;
    }

    public String getPlayer() {
        return player;
    }

    public void setPlayer(String player) {
        this.player = player;
    }

    public int getRemoved() {
        return removed;
    }

    public void setRemoved(int removed) {
        this.removed = removed;
    }
}
