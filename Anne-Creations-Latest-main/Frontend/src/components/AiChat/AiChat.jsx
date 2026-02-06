'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, IconButton, Avatar, CircularProgress } from '@mui/material';
import { MdChat, MdClose, MdSend, MdSmartToy, MdVerified, MdError } from 'react-icons/md';
import axiosClient from '@/lib/axiosClient';

const AiChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, sender: 'bot', text: 'Hi! I am the Anne Creations AI Assistant. I can help you find designs or resolve download issues.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await axiosClient.post('/api/ai/chat', { message: userMsg.text });
            const botReply = res.data;

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'bot',
                text: botReply.reply,
                type: botReply.type,
                data: botReply.data,
                fields: botReply.fields
            }]);

        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: 'Sorry, I am having trouble connecting right now.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySubmit = async (e, orderId, productId) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axiosClient.post('/api/ai/verify', { orderId, productId });
            if (res.data.success) {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    sender: 'bot',
                    text: res.data.message,
                    link: res.data.link
                }]);
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    sender: 'bot',
                    text: `Verification Failed: ${res.data.message}`
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: 'Error verifying details.' }]);
        } finally {
            setLoading(false);
        }
    };

    // Render Custom Bot components inside chat
    const renderBotContent = (msg) => {
        if (msg.type === 'products' && msg.data) {
            return (
                <Box sx={{ mt: 1, display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                    {msg.data.map(p => (
                        <Paper key={p._id} sx={{ minWidth: 120, p: 1, cursor: 'pointer' }} onClick={() => window.location.href = `/product/${p.productModel}`}>
                            <img src={p.image ? `/image/${p.image}` : '/placeholder.png'} alt={p.productModel} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 4 }} />
                            <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', mt: 0.5 }}>{p.productModel}</Typography>
                        </Paper>
                    ))}
                </Box>
            );
        }

        if (msg.type === 'request_info') {
            return (
                <Box component="form" onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    handleVerifySubmit(e, formData.get('orderId'), formData.get('productId'));
                }} sx={{ mt: 2, bgcolor: 'background.paper', p: 2, borderRadius: 2, border: '1px solid #eee' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Verify Purchase</Typography>
                    <TextField name="orderId" size="small" placeholder="Order ID or Payment ID" fullWidth sx={{ my: 1 }} required />
                    <TextField name="productId" size="small" placeholder="Product ID or Model Name" fullWidth sx={{ mb: 1 }} required />
                    <Button type="submit" variant="contained" size="small" fullWidth disabled={loading}>Verify & Get Link</Button>
                </Box>
            );
        }

        if (msg.link) {
            return (
                <Button
                    variant="contained"
                    color="success"
                    href={msg.link}
                    target="_blank"
                    sx={{ mt: 1, textTransform: 'none' }}
                >
                    Download Securely
                </Button>
            );
        }

        return null;
    };

    // State for drag
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        isDragging.current = false;
        dragStart.current = { x: e.clientX, y: e.clientY };

        const handleMouseMove = (mmEvent) => {
            const dx = dragStart.current.x - mmEvent.clientX;
            const dy = dragStart.current.y - mmEvent.clientY;

            // If moved significantly, it is a drag
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                isDragging.current = true;
                setPosition((prev) => ({
                    x: prev.x + dx,
                    y: prev.y + dy,
                }));
                dragStart.current = { x: mmEvent.clientX, y: mmEvent.clientY };
            }
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleClick = () => {
        if (!isDragging.current) {
            setIsOpen(!isOpen);
        }
    };

    return (
        <>
            {/* Floating Toggle - Movable */}
            <Box
                onMouseDown={handleMouseDown}
                sx={{
                    position: 'fixed',
                    bottom: position.y,
                    right: position.x,
                    zIndex: 9999,
                    cursor: 'grab',
                    touchAction: 'none'
                }}
            >
                <IconButton
                    onClick={handleClick}
                    sx={{
                        bgcolor: 'white',
                        color: 'var(--primary)',
                        width: 70,
                        height: 70,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        '&:hover': { bgcolor: '#f8f9fa' },
                        p: 0,
                        overflow: 'hidden'
                    }}
                >
                    {isOpen ? <MdClose size={30} /> : (
                        <img
                            src="/assets/chatbot.png"
                            alt="Chat"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>'; }} // Fallback if image missing
                        />
                    )}
                </IconButton>
            </Box>

            {/* Chat Window - Follows Button */}
            {isOpen && (
                <Paper sx={{
                    position: 'fixed',
                    bottom: position.y + 80, // Open above the button
                    right: position.x,
                    width: 350,
                    height: 500,
                    maxWidth: 'calc(100vw - 40px)',
                    maxHeight: 'calc(100vh - 120px)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                }}>
                    {/* Header */}
                    <Box sx={{ p: 2, bgcolor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src="/assets/chatbot.png" sx={{ bgcolor: 'white' }} />
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold">Anne Assistant</Typography>
                            <Typography variant="caption">Product & Download Support</Typography>
                        </Box>
                    </Box>

                    {/* Messages */}
                    <Box sx={{ flex: 1, p: 2, overflowY: 'auto', bgcolor: '#f8f9fa' }}>
                        {messages.map((msg) => (
                            <Box key={msg.id} sx={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', mb: 2 }}>
                                <Box sx={{ maxWidth: '85%' }}>
                                    <Paper sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: msg.sender === 'user' ? 'var(--primary)' : 'white',
                                        color: msg.sender === 'user' ? 'white' : 'text.primary',
                                        border: msg.sender === 'user' ? 'none' : '1px solid #e0e0e0'
                                    }}>
                                        <Typography variant="body2">{msg.text}</Typography>
                                        {msg.sender === 'bot' && renderBotContent(msg)}
                                    </Paper>
                                </Box>
                            </Box>
                        ))}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input */}
                    <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #eee', display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            disabled={loading}
                        />
                        <IconButton onClick={handleSend} disabled={loading || !input.trim()} color="primary">
                            {loading ? <CircularProgress size={24} /> : <MdSend />}
                        </IconButton>
                    </Box>
                </Paper>
            )}
        </>
    );
};

export default AiChat;
