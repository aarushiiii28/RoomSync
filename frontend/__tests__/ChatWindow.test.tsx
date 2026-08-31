import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import ChatWindow from "@/components/chat/ChatWindow";
import { Message } from "@/services/chat";
import api from "@/services/api";

jest.mock("@/services/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  }
}));

// Mock next/image so it doesn't crash the tests
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />; // eslint-disable-line @next/next/no-img-element
  },
}));

// Mock crypto.randomUUID for predictable client_ids
Object.defineProperty(globalThis.crypto, "randomUUID", {
  value: () => "mock-client-id-123",
});

describe("ChatWindow Optimistic UI", () => {
  it("should optimistically render a message and reconcile with server echo", async () => {
    let mockOnMessageCallback: (msg: Message) => void = () => {};
    let mockOnStatusUpdateCallback: (update: any) => void = () => {};
    
    const mockSendMessage = jest.fn().mockReturnValue(true);
    
    // Mock the API call for fetching messages
    (api.get as jest.Mock).mockResolvedValue({ data: [] });

    render(
      <ChatWindow
        conversationId="conv-1"
        otherUser={{ id: "user-2", username: "Rohan" }}
        currentUserId="user-1"
        sendMessage={mockSendMessage}
        onMessage={(cb) => { mockOnMessageCallback = cb; }}
        onStatusUpdate={(cb) => { mockOnStatusUpdateCallback = cb; }}
      />
    );

    // Wait for loading to finish and "No messages yet" to appear
    await waitFor(() => {
      expect(screen.getByText("No messages yet")).toBeInTheDocument();
    });

    // Find input and type a message
    const input = screen.getByPlaceholderText("Type a message…");
    fireEvent.change(input, { target: { value: "Hello World" } });
    
    // Find the Send button and click it
    // Wait, the send button is an icon. Let's find it by role or closest svg.
    // Let's just fire enter key on the input.
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // The message should appear instantly
    expect(screen.getByText("Hello World")).toBeInTheDocument();
    expect(mockSendMessage).toHaveBeenCalledWith("conv-1", "Hello World", "mock-client-id-123");

    // We can't directly check the SVG icon easily in JSDOM, but we know it's in the DOM.
    // Now simulate the server echoing the message back
    const serverMessage: Message = {
      id: "real-db-id-456",
      client_id: "mock-client-id-123",
      conversation_id: "conv-1",
      sender_id: "user-1",
      content: "Hello World",
      status: "sent",
      created_at: new Date().toISOString(),
      delivered_at: null,
      read_at: null,
    };

    act(() => {
      mockOnMessageCallback(serverMessage);
    });

    // The message should still be there (no duplicates)
    const messages = screen.getAllByText("Hello World");
    expect(messages.length).toBe(1);
    
    // Simulate another message from the server that does NOT have this client_id (e.g. from the other user)
    const otherUserMessage: Message = {
      id: "real-db-id-789",
      conversation_id: "conv-1",
      sender_id: "user-2",
      content: "Hi there!",
      status: "sent",
      created_at: new Date().toISOString(),
      delivered_at: null,
      read_at: null,
    };

    act(() => {
      mockOnMessageCallback(otherUserMessage);
    });

    // Both messages should be present
    expect(screen.getByText("Hello World")).toBeInTheDocument();
    expect(screen.getByText("Hi there!")).toBeInTheDocument();
  });
});
