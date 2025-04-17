
import { useState } from 'react';
import './App.css'

function App() {
  const [fromEmail,setFromEmails]=useState<{created_at:string,email:string,id:number}[]>([])
  const [curEmail,setCurEmail]=useState<string>('')
const process = ()=>{
fetch('http://localhost:3002/api/process', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ start: false }),
});
}
const getEmails = async ()=>{
setFromEmails([])
const res = await fetch('http://localhost:3002/api/fromEmails', {
  method: 'GET',

});
const {data}:{data:{created_at:string,email:string,id:number}[]} = await res.json()
setFromEmails(data)
}
const postEmails = async ({email}:{email:string})=>{
await fetch('http://localhost:3002/api/fromEmails', {
 method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({email}),

});

setCurEmail('')
}
const deleteEmail = async (id:number)=>{
await fetch('http://localhost:3002/api/fromEmails', {
 method: 'delete',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({id:id}),

});

}
  return (
    <>
      <div>
        <button onClick={process}>Process</button>
        <button onClick={getEmails}>Get Emails</button>
        <div>
          <input value={curEmail} onChange={(e)=>setCurEmail(e.target.value)} type="email" name="" id="" />
          <button onClick={()=>postEmails({email:curEmail})}>post</button>
        </div>
        <div>
          <ul>
            {fromEmail.map(el=>{
              return (
                <li key={el.id}>{el.email}
                <button onClick={()=>{deleteEmail(el.id)}}>delete</button></li>
              )
            })}
          </ul>
        </div>
       </div>
    </>
  )
}

export default App
