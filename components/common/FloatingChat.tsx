'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Paperclip, Image, X, MessageCircle, Users } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
}

interface ChatRoom {
  id: string;
  name: string;
  members: any[];
}

export default function FloatingChat() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch or create company chat room
  useEffect(() => {
    if (isOpen && !selectedRoom) {
      fetchChatRoom();
    }
  }, [isOpen, selectedRoom]);

  const fetchChatRoom = async () => {
    try {
      setIsLoading(true);

      // Debug session data
      console.log('FloatingChat - Session data:', session);
      console.log('FloatingChat - User data:', session?.user);
      console.log('FloatingChat - Company ID:', (session?.user as any)?.companyId);

      const response = await fetch('/api/chat/rooms');
      console.log('FloatingChat - Rooms response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('FloatingChat - Rooms data:', data);

        if (data.success && data.rooms && data.rooms.length > 0) {
          setSelectedRoom(data.rooms[0]);
          fetchMessages(data.rooms[0].id);
        } else {
          // Create room if none exists
          console.log('FloatingChat - Creating new room...');
          const createResponse = await fetch('/api/chat/rooms', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          console.log('FloatingChat - Create response status:', createResponse.status);

          if (createResponse.ok) {
            const createData = await createResponse.json();
            console.log('FloatingChat - Create data:', createData);

            if (createData.success && createData.room) {
              setSelectedRoom(createData.room);
              fetchMessages(createData.room.id);
            }
          } else {
            const errorData = await createResponse.json();
            console.error('FloatingChat - Create error:', errorData);
          }
        }
      } else {
        const errorData = await response.json();
        console.error('FloatingChat - Rooms error:', errorData);
      }
    } catch (error) {
      console.error('Error fetching chat room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?roomId=${roomId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Add message to local state immediately for better UX
    const tempMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      senderId: (session?.user as any)?.id || 'current-user',
      senderName: session?.user?.name || 'You',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          content: messageContent,
          type: 'text'
        }),
      });

      const data = await response.json();
      console.log('API response:', response.status, data.success);

      if (response.ok && data.success && data.message) {
        // Replace temp message with real message from server
        setMessages(prev => prev.map(msg =>
          msg.id === tempMessage.id ? data.message : msg
        ));
      } else {
        console.error('API error:', data);
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        alert(`Failed to send message: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoom) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomId', selectedRoom.id);

    try {
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.message) {
          setMessages(prev => [...prev, data.message]);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!messageId) return;

    try {
      const response = await fetch(`/api/chat/messages?messageId=${messageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(prev => prev.filter(msg => msg.id !== messageId));
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!session?.user) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-300 flex items-center justify-center z-50 group"
        >
          <MessageCircle className="w-6 h-6" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white text-xs font-bold">
            1
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="bg-primary text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  {selectedRoom?.name || 'Company Chat'}
                </h3>
                <p className="text-xs opacity-80">
                  {selectedRoom?.members?.length || 0} members
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              messages.map((message) => {
                const currentUserId = (session?.user as any)?.id;
                const isCurrentUser = message.senderId === currentUserId;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${isCurrentUser
                        ? 'bg-primary text-white'
                        : 'bg-lightGray text-darkGray'
                      }`}>
                      {!isCurrentUser && (
                        <p className="text-xs font-medium mb-1 opacity-70">
                          {message.senderName}
                        </p>
                      )}
                      {message.type === 'image' && message.fileUrl ? (
                        <div className="space-y-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={message.fileUrl}
                            alt={message.fileName || 'Image'}
                            className="max-w-xs max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(message.fileUrl, '_blank')}
                          />
                          <p className="text-xs text-gray-600">{message.fileName}</p>
                        </div>
                      ) : message.type === 'file' && message.fileUrl ? (
                        <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
                          <Paperclip className="w-3 h-3 text-gray-500" />
                          <a
                            href={message.fileUrl}
                            download={message.fileName}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {message.fileName}
                          </a>
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                      <p className={`text-xs mt-1 ${isCurrentUser ? 'text-white/70' : 'text-mediumGray'
                        }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1 hover:bg-lightGray rounded transition-colors"
              >
                <Paperclip className="w-4 h-4 text-mediumGray" />
              </button>

              <button
                onClick={() => imageInputRef.current?.click()}
                className="p-1 hover:bg-lightGray rounded transition-colors"
              >
                <Image className="w-4 h-4 text-mediumGray" />
              </button>

              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />

              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
                className="p-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.zip,.rar"
      />
      <input
        ref={imageInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*"
      />
    </>
  );
}
