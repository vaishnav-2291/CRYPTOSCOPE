import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";


function Register() {


  const navigate = useNavigate();


  const [name,setName] = useState("");

  const [email,setEmail] = useState("");

  const [password,setPassword] = useState("");

  const [loading,setLoading] = useState(false);






  const handleRegister = async(e)=>{


    e.preventDefault();



    try{


      setLoading(true);



      const response = await fetch("/api/auth/register",{


        method:"POST",


        headers:{


          "Content-Type":"application/json"

        },


        body:JSON.stringify({

          name,

          email,

          password

        })


      });





      const data = await response.json();





      if(!response.ok){


        alert(data.message || "Registration Failed");

        return;


      }






      alert("Registration Successful");



      navigate("/login");




    }


    catch(error){


      console.error(error);


      alert("Server Error");


    }


    finally{


      setLoading(false);


    }


  };







return(



<div className="
min-h-screen
bg-slate-950
flex
items-center
justify-center
px-6
">






<div className="
w-full
max-w-md
bg-white/5
backdrop-blur-xl
border
border-white/10
rounded-3xl
p-8
">





<h1 className="
text-4xl
font-bold
text-cyan-400
text-center
">

🚀 Create Account

</h1>





<p className="
text-gray-400
text-center
mt-3
">

Join CryptoScope AI

</p>







<form

onSubmit={handleRegister}

className="mt-8 space-y-5"

>







<input

type="text"

placeholder="Full Name"

value={name}

onChange={(e)=>setName(e.target.value)}

className="
w-full
p-4
rounded-xl
bg-slate-900
border
border-cyan-400/30
text-white
outline-none
"

required

/>








<input

type="email"

placeholder="Email Address"

value={email}

onChange={(e)=>setEmail(e.target.value)}

className="
w-full
p-4
rounded-xl
bg-slate-900
border
border-cyan-400/30
text-white
outline-none
"

required

/>








<input

type="password"

placeholder="Password"

value={password}

onChange={(e)=>setPassword(e.target.value)}

className="
w-full
p-4
rounded-xl
bg-slate-900
border
border-cyan-400/30
text-white
outline-none
"

required

/>








<button

type="submit"

disabled={loading}

className="
w-full
py-4
rounded-xl
bg-cyan-500
hover:bg-cyan-400
text-black
font-bold
transition
disabled:opacity-50
"

>

{

loading

?

"Creating Account..."

:

"Create Account"

}


</button>







</form>







<p className="
text-center
text-gray-400
mt-6
">


Already have an account?

{" "}



<Link

to="/login"

className="
text-cyan-400
hover:underline
"

>

Login

</Link>



</p>







</div>





</div>



);


}


export default Register;