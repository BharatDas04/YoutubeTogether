import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Overlay from './Overlay';
import { FaPaperPlane, FaYoutube } from 'react-icons/fa';
import ReactPlayer from 'react-player';
const apiUrl = import.meta.env.VITE_API_URL;

const socket = io(apiUrl); // Backend URL

const App = () => {
  const [roomCode, setRoomCode] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [currVideo, setCurrVideo] = useState("")
  const chatContainerRef = useRef(null);
  const playerRef = useRef(null);
  const [isAdmin, setIsAdmin] = useState(false)
  const [vidLink, setVidLink] = useState("")
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Scroll to the bottom whenever a new message is added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if(isValidYouTubeUrl(vidLink)){
      setCurrVideo(vidLink)
      videoURL(vidLink)
    }
  }, [vidLink])
  

  const isValidYouTubeUrl = (url) => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return regex.test(url);
  };


  // Create a new room
  const createRoom = async () => {
    try {
      const response = await axios.post(apiUrl + 'createRoom');
      const newRoomCode = await response.data.roomCode;
      setRoomCode(newRoomCode);
      setIsAdmin(true)
      socket.emit('joinRoom', newRoomCode); // Join the room
      setNameInput("Admin")
      setIsOpen(false)
    } catch (error) {
      console.error('Error creating room', error);
    }
  };

  // Join an existing room
  const joinRoom = async () => {
    try {
      const response = await axios.post( apiUrl + 'joinRoom', { roomCode: roomInput});
      if (response.data.success) {
        setRoomCode(roomInput);
        socket.emit('joinRoom', roomInput); // Join the room
        setIsOpen(false)
      }else{
        console.log("unable to connect")
      }
    } catch (error) {
      console.error('Error joining room', error);
    }
  };

  // Handle sending messages
  const sendMessage = () => {
    if (message && roomCode) {
      socket.emit('chatMessage', { roomCode, message, name: nameInput });
      setMessage(''); // Clear the message input after sending
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      if(message.length > 0 ){
        sendMessage();
      }
    }
  };

  const pause = () => {
      socket.emit('pause', { roomCode: roomCode });
  };
  
  const play = () => {
    socket.emit('play', { roomCode: roomCode });
  };

  const seek = () => {
    if(isAdmin){
      socket.emit('seek', { "roomCode": roomCode, "currentTime": playerRef.current.getCurrentTime() });
    }
  };

  const videoURL = (currVideo) => {
    socket.emit('videoURL', { "roomCode": roomCode, "url": currVideo });
  };


  // Listen for incoming messages
  useEffect(() => {
    socket.on('message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });
    socket.on('play', () => {
        setIsPlaying(true);
    });
    socket.on('pause', (data) => {
        setIsPlaying(false)
    });
    socket.on('seek', (data) => {
      const { currentTime } = data
      console.log("IN SEEK RN", currentTime)
      playerRef.current.seekTo(currentTime, 'seconds');
      setIsPlaying(false)
    });
    socket.on('videoURL', (data) => {
      const {roomCode, url} = data
      if( url.length > 1){
        setCurrVideo(url)
      }
    });
    socket.on("someoneJoined", (data)=>{
      const {admin} = data
      if(admin){
        alert("NEW USER JOINED")
      }
      setIsPlaying(false);
    })
    return () => {
      socket.off('play');
      socket.off('pause');
      socket.off('seek');
      socket.off('message');
      socket.off('videoURL');
      socket.off('someoneJoined');
    };
  }, []);



  return (
    <>
    <Overlay isOpen={isOpen} joinRoom={joinRoom} setRoomInput={setRoomInput} setNameInput={setNameInput} createRoom={createRoom} />
    <div className='flex flex-col h-screen bg-[#0a1012]'>
      <div className='flex gap-10 py-2 px-5'>
        <div><p className='text-gray-700 mukta-regular text-xs font-bold'>FAQ</p></div>
        <div><p className='text-gray-700 mukta-regular text-xs font-bold'>Terms of Service</p></div>
        <div><p className='text-gray-700 mukta-regular text-xs font-bold'>Support</p></div>
        <div><p className='text-gray-400 mukta-regular text-xs'>Room : <span className='text-gray-400 mukta-regular text-xs'> {roomCode} </span></p></div>
      </div>  

      <div className='flex gap-3 px-1 h-screen pb-2'>
        <div className='bg-[#12191C] w-5/6 rounded-xl px-5 py-3'>
            <div className="video-wrapper h-full">
              <ReactPlayer 
                url={currVideo}
                controls= {isAdmin ? true : false}
                config={{
                  youtube: {
                    playerVars: {
                      vq: 'hd1080', // Sets the default quality to 1080p
                    },
                  },
                }}
                width="100%"     
                height="100%"
                ref={playerRef}
                playing={isPlaying}
                onPause={() => {pause(); console.log(isAdmin); seek()}}
                onPlay={() => {play()}}
              />
            </div>
        </div>

        <div className='w-1/6 flex flex-col py-3 justify-between gap-2'>
                {isAdmin && <div className='flex gap-2 items-center border border-gray-600 rounded-md px-3 py-2'>
                  <span><FaYoutube size="1.2em" className='text-gray-500' /></span>
                  <input type="text" placeholder='Input link here' className='bg-transparent text-gray-700 outline-none' onChange={(e) => {setVidLink(e.target.value)}} />
                </div>}
                <div className=''>
                  <p className='text-gray-300 mukta-regular font-bold text-md'>Chat</p>
                  <p className='text-gray-500 text-sm '>1. If the video is not synced, pause once.</p>
                  <p className='text-gray-500 text-sm '>2. Only the admin can seek.</p>
                <div>
                  
              </div>
          </div>  

          <div className='overflow-y-auto hide-scrollbar mt-auto bg-[#0a1012] max-h-96 fading-border' ref={chatContainerRef}>
            {messages.map((msg, index) => (
              <div key={index} className='flex flex-col gap-1 bg-gray-900 pl-3 pr-1 py-2 rounded-xl mt-2'>
                <strong className='text-gray-600 text-sm'>{msg.name}</strong> 
                <div>
                  <p className='text-gray-500 text-sm'>{msg.message}</p>
                </div>
              </div>
            ))}
          </div>  

          <div className='flex gap-2 items-center justify-between bg-gray-900 py-2 pl-3 rounded-md'>
            <button onClick={sendMessage}><FaPaperPlane size="1em" className='text-gray-500'/></button>
            <input
              onKeyDown={handleKeyDown}
              type="text"
              placeholder='Enter Message'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className='flex-grow bg-transparent outline-none px-2 py-1 rounded-md text-sm text-gray-500'
            />
          </div>
        </div>
      </div>
    </div>

    </>
    
    // <div>
    //   <h1>Chat Application</h1>

    //   {status === '' && (
    //     <div>
    //       <button onClick={createRoom}>Create Room</button>
    //       <input
    //         type="text"
    //         placeholder="Enter room code"
    //         value={roomInput}
    //         onChange={(e) => setRoomInput(e.target.value)}
    //       />
    //       <input
    //         type="text"
    //         placeholder="Enter your name"
    //         value={nameInput}
    //         onChange={(e) => setNameInput(e.target.value)}
    //       />
    //       <button onClick={joinRoom}>Join Room</button>
    //     </div>
    //   )}

    //   {status === 'chatting' && (
    //     <div>
    //       <h2>Room Code: {roomCode}</h2>
    //       <div>
    //         {messages.map((msg, index) => (
    //           <div key={index}>
    //             <strong>User {msg.name}:</strong> {msg.message}
    //           </div>
    //         ))}
    //       </div>
    //       <input
    //         type="text"
    //         value={message}
    //         onChange={(e) => setMessage(e.target.value)}
    //       />
    //       <button onClick={sendMessage}>Send</button>
    //     </div>
    //   )}

    //   {status === 'error' && <div>Error occurred. Please try again.</div>}
    // </div>
  );
};

export default App;
