document.addEventListener("DOMContentLoaded",()=>{


const loginForm = document.getElementById("loginForm");

const registerForm = document.getElementById("registerForm");

const switchBtn = document.getElementById("switchBtn");

const title = document.getElementById("title");

const switchText = document.getElementById("switchText");



let isLogin = true;



// Switch Login / Register

switchBtn.addEventListener("click",(e)=>{


    e.preventDefault();



    isLogin = !isLogin;



    if(isLogin){


        loginForm.style.display="block";

        registerForm.style.display="none";


        title.innerText="Login";


        switchText.innerText="Don't have account?";


        switchBtn.innerText="Register";


    }

    else{


        loginForm.style.display="none";


        registerForm.style.display="block";


        title.innerText="Register";


        switchText.innerText="Already have account?";


        switchBtn.innerText="Login";


    }


});





// Register


registerForm.addEventListener("submit",async(e)=>{


e.preventDefault();



const userData={


name:
document.getElementById("registerName").value,


email:
document.getElementById("registerEmail").value,


password:
document.getElementById("registerPassword").value


};




const response = await fetch("/api/auth/register",{


method:"POST",


headers:{


"Content-Type":"application/json"


},


body:JSON.stringify(userData)


});



const data = await response.json();



alert(data.message);



});






// Login


loginForm.addEventListener("submit",async(e)=>{


e.preventDefault();



const userData={



email:
document.getElementById("loginEmail").value,



password:
document.getElementById("loginPassword").value



};





const response = await fetch("/api/auth/login",{


method:"POST",


headers:{


"Content-Type":"application/json"


},


body:JSON.stringify(userData)


});




const data = await response.json();





if(data.token){



localStorage.setItem(
"token",
data.token
);



alert("Login Successful");



window.location.href="/";



}

else{


alert(data.message);


}



});



});