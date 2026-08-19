const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  window.location = "login.html";
}
const cards = document.querySelectorAll(".card")

cards.forEach((card,i)=>{

card.style.opacity=0

setTimeout(()=>{
card.style.opacity=1
card.style.transform="translateY(0)"
},i*200)

})