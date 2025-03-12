document.getElementById("getStarted").addEventListener("click", function(){
    const div = document.getElementById("loginContainer");
    div.classList.add("visible");
    div.style.transform = "translateX(350px)";
    
});

document.getElementById("loginBtn").addEventListener("click", function(e){
    window.location.href = "mainPage.html";
});