import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";


function Navbar() {


  const navigate = useNavigate();


  const [user,setUser] = useState(null);


  const token = localStorage.getItem("token");





  useEffect(()=>{


    if(token){

      fetchUser();

    }


  },[]);







  const fetchUser = async()=>{


    try{


      const response = await fetch("/api/auth/me",{


        headers:{


          Authorization: token


        }


      });




      const data = await response.json();




      if(data.success){


        setUser(data.user);


      }

      else{


        logout();

      }



    }

    catch(err){


      console.log(err);


    }


  };








  const logout = ()=>{


    localStorage.removeItem("token");


    setUser(null);


    navigate("/login");


  };








  return (


<nav className="
w-full
fixed
top-0
left-0
z-50
bg-slate-950/80
backdrop-blur-xl
border-b
border-white/10
">






<div className="
max-w-7xl
mx-auto
px-6
py-4
flex
items-center
justify-between
">






<Link to="/">


<h1 className="
text-2xl
font-bold
text-cyan-400
">


🚀 CryptoScope AI


</h1>


</Link>









<div className="
hidden
md:flex
gap-8
text-gray-300
">



<Link 
to="/"
className="hover:text-cyan-400"
>

Home

</Link>





<a 
href="#wallet"
className="hover:text-cyan-400"
>

Wallet

</a>





<a 
href="#stats"
className="hover:text-cyan-400"
>

Dashboard

</a>





<Link
to="/history"
className="hover:text-cyan-400"
>

History

</Link>






<a 
href="#market"
className="hover:text-cyan-400"
>

Market

</a>





</div>









<div className="
flex
items-center
gap-4
">






{

token ?



(


<>



<div className="
hidden
sm:block
px-4
py-2
rounded-xl
bg-white/5
border
border-white/10
text-white
">


👤 {user ? user.name : "User"}


</div>






<button

onClick={logout}

className="
px-5
py-2
rounded-xl
bg-red-500
hover:bg-red-400
text-white
font-semibold
transition
"

>

Logout

</button>



</>



)



:



(


<>


<Link to="/login">


<button

className="
px-5
py-2
rounded-xl
border
border-cyan-400
text-cyan-400
hover:bg-cyan-400
hover:text-black
transition
"

>

Login

</button>


</Link>





<Link to="/register">


<button

className="
px-5
py-2
rounded-xl
bg-cyan-500
hover:bg-cyan-400
text-black
font-bold
"

>

Register

</button>


</Link>



</>



)


}






</div>







</div>



</nav>



  );

}



export default Navbar;