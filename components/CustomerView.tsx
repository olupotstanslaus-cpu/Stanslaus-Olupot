import React, { useState, useRef, useEffect } from 'react';
import { Message, Order, ChatStep, MenuItem } from '../types';
import { BOT_NAME } from '../constants';
import { generateBotResponse } from '../services/geminiService';
import { SendIcon, BotIcon, UserIcon, CheckCircleIcon, DotIcon, XCircleIcon, ClipboardListIcon } from './Icons';

interface CustomerViewProps {
  addOrder: (newOrder: Omit<Order, 'id' | 'status' | 'deliveryAgent'>) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  menuItems: MenuItem[];
}

const CustomerView: React.FC<CustomerViewProps> = ({ addOrder, messages, setMessages, menuItems }) => {
  const [input, setInput] = useState('');
  const [chatStep, setChatStep] = useState<ChatStep>(ChatStep.GREETING);
  const [orderDetails, setOrderDetails] = useState({ name: '', item: '', address: '' });
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isBotTyping]);

  const addMessage = (text: string, sender: 'user' | 'bot', isNotification: boolean = false) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, sender, isNotification }]);
  };

  const handleBotResponse = async (prompt: string, userInputForNextStep?: string) => {
    setIsBotTyping(true);
    try {
      const response = await generateBotResponse(prompt);
      addMessage(response, 'bot');
      if(userInputForNextStep !== undefined) {
         handleUserAction(userInputForNextStep, true);
      }
    } catch (error) {
      console.error("Error getting bot response:", error);
      addMessage("Sorry, I'm having some trouble right now. Please try again later.", 'bot');
    } finally {
      setIsBotTyping(false);
    }
  };

  useEffect(() => {
    if (messages.length === 0) {
      handleBotResponse(`You are a friendly WhatsApp chatbot for a service called '${BOT_NAME}'. Start the conversation by greeting the user and asking for their name to begin an order.`);
      setChatStep(ChatStep.ASK_NAME);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserAction = (userInput: string, isAutomated: boolean = false) => {
    if (!isAutomated) {
       addMessage(userInput, 'user');
    }

    switch (chatStep) {
      case ChatStep.ASK_NAME:
        setOrderDetails(prev => ({ ...prev, name: userInput }));
        const menuString = menuItems.map(item => `- ${item.name} ($${item.price.toFixed(2)})`).join('\n');
        handleBotResponse(`The user's name is ${userInput}. Welcome them by name. Here is our menu:\n${menuString}\n\nPlease ask them what they would like to order.`);
        setChatStep(ChatStep.ASK_ITEM);
        break;
      case ChatStep.ASK_ITEM:
        setOrderDetails(prev => ({ ...prev, item: userInput }));
        handleBotResponse(`The user wants to order: "${userInput}". Acknowledge the item and ask for their delivery address.`);
        setChatStep(ChatStep.ASK_ADDRESS);
        break;
      case ChatStep.ASK_ADDRESS:
        setOrderDetails(prev => ({ ...prev, address: userInput }));
        const currentOrder = { ...orderDetails, address: userInput };
        handleBotResponse(
          `The user's address is "${userInput}". Present this order summary for confirmation:
           - Name: ${currentOrder.name}
           - Item: ${currentOrder.item}
           - Address: ${currentOrder.address}
           Ask them to type 'yes' to confirm or 'no' to cancel.`,
           'yes'
        );
        setChatStep(ChatStep.CONFIRMATION);
        break;
      case ChatStep.CONFIRMATION:
        if (userInput.toLowerCase() === 'yes') {
          const finalOrder = {
             customerName: orderDetails.name,
             item: orderDetails.item,
             address: orderDetails.address,
             timestamp: new Date().toLocaleTimeString(),
          };
          addOrder(finalOrder);
          handleBotResponse(`The user confirmed the order. Thank them and let them know their order has been placed successfully. Tell them they will be notified here once an admin approves it.`);
          setChatStep(ChatStep.ORDER_PLACED);
        } else {
          handleBotResponse(`The user cancelled the order. Apologize and ask if they would like to start over.`);
          setChatStep(ChatStep.GREETING); // Reset
          setOrderDetails({ name: '', item: '', address: '' });
        }
        break;
      case ChatStep.ORDER_PLACED:
         handleBotResponse(`The user is trying to chat after placing an order. Gently remind them that their order is being processed and they'll be notified of any updates. Ask them to start a new chat if they wish to place another order.`);
        break;
    }
  };

  const handleSend = () => {
    if (input.trim() && !isBotTyping) {
      handleUserAction(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#ECE5DD]">
      <div className="bg-[#075E54] text-white p-3 flex items-center shadow-md">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
            <BotIcon className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h2 className="font-bold text-lg">{BOT_NAME}</h2>
          <p className="text-sm text-gray-200">Online</p>
        </div>
      </div>
      <div className="flex-grow p-4 overflow-y-auto" style={{backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")'}}>
        {messages.map((msg, index) => (
          msg.isNotification ? (
            <div key={index} className="flex justify-center my-2">
              <div className={`text-sm font-medium rounded-xl px-4 py-2 shadow-md flex items-center space-x-2 ${
                  msg.notificationType === 'success' ? 'bg-green-100 text-green-800' :
                  msg.notificationType === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
              }`}>
                  {msg.notificationType === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                  {msg.notificationType === 'error' && <XCircleIcon className="w-5 h-5 text-red-600" />}
                  {msg.notificationType !== 'success' && msg.notificationType !== 'error' && <ClipboardListIcon className="w-5 h-5 text-blue-600" />}
                  <span>{msg.text}</span>
              </div>
            </div>
          ) : (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                <div className={`rounded-lg px-4 py-2 max-w-[80%] shadow ${msg.sender === 'user' ? 'bg-[#DCF8C6] text-gray-800' : 'bg-white text-gray-800'}`}>
                <p>{msg.text}</p>
                </div>
            </div>
          )
        ))}
         {isBotTyping && (
          <div className="flex justify-start mb-3">
            <div className="rounded-lg px-4 py-2 bg-white text-gray-500 shadow flex items-center">
              <DotIcon className="animate-bounce" />
              <DotIcon className="animate-bounce delay-150" />
              <DotIcon className="animate-bounce delay-300" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="bg-gray-100 p-3 flex items-center border-t border-gray-300">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isBotTyping ? "Bot is typing..." : "Type a message"}
          className="flex-grow rounded-full py-2 px-4 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
          // FIX: Corrected typo from isBotyping to isBotTyping.
          disabled={isBotTyping || chatStep === ChatStep.ORDER_PLACED}
        />
        <button
          onClick={handleSend}
          // FIX: Corrected typo from isBotyping to isBotTyping.
          disabled={isBotTyping || chatStep === ChatStep.ORDER_PLACED}
          className="bg-[#128C7E] text-white rounded-full p-3 ml-3 hover:bg-[#075E54] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <SendIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default CustomerView;