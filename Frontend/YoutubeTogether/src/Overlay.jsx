import { useState } from "react";
import Loading from "./Loading"

function Overlay({ isLoading, isOpen, joinRoom, setRoomInput, roomInput, setNameInput, nameInput, createRoom }) {
    
    if (!isOpen) return null;
    const [codeError, setCodeError] = useState(false)
    const [nickNameError, setNickNameError] = useState(false)
    function submitForm(){
        if(roomInput.length < 1){
            setCodeError(true)
        }
        if(nameInput.length < 1){
            setNickNameError(true)
        }
        else{
            joinRoom();
        }
    }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a2d34] p-8 rounded-lg shadow-lg max-w-sm w-full">
            {isLoading && <div className="flex items-center justify-center w-full"> <Loading/> </div>}
            {!isLoading && <div className='flex gap-4 flex-col items-center'>
                <div className="w-full">
                    <input onChange={(e) => {setRoomInput(e.target.value)}} className='outline-none rounded-md py-2 px-3 w-full bg-[#1f343c] placeholder-gray-600 text-gray-400' maxLength={6} type="text" placeholder='Enter the room code' />
                    {codeError && <p className="text-red-600 text-[0.6em]">*Enter the Code</p>}
                </div>
                <div className="w-full">
                    <input onChange={(e) => {setNameInput(e.target.value)}} className='outline-none rounded-md py-2 px-3 w-full bg-[#1f343c] placeholder-gray-600 text-gray-400' type="text" placeholder='Enter your Nickname' maxLength={10} />
                    {nickNameError && <p className="text-red-600 text-[0.6em]">*Enter the Nickname</p>}</div>
                <button className='bg-slate-600 py-2 px-4 rounded-md w-full'><p className='text-gray-400' onClick={submitForm}>Join Room</p></button>
                <div><p className='text-gray-600'>OR</p></div>
                <div className=' w-full'><button onClick={() => {createRoom()}} className='bg-slate-600 py-2 px-4 rounded-md w-full'><p className='text-gray-400'>Create Room</p></button></div>
            </div>}
      </div>
    </div>
  );
}

export default Overlay;
