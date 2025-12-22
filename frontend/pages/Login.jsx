import React, { useState } from "react";
import axios from axios

const Login = () => {
    const[email, setEmail] = useState("")
    const[password, setPassword] = useState("")

    const handleSubmit = async () =>{
     
    try{
        const response = await axios.post("http://localhost:3001/api/login", {
        email,
        password,
      })
      console.log(response)
    }catch(error){
     console.error(`Deu algum erro: ${error}`)
    }

    }

    return (
        <form action= {handleSubmit}>
            
            <h1>Faça seu Login</h1>
            <input 
            type="email"
            name="email"
            id="email"
            placeholder="Digite seu E-mail" required 
            onChange={(e) => setEmail(e.target.value)}
            />

            <input 
            type="password"
            name="password"
            id="password"
            placeholder="Digite sua Senha" required 
            onChange={(e) => setPassword(e.target.value)}
            />

            <button>Fazer login</button>
        </form>
    )
}

export default Login