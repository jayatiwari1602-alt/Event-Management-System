document.getElementById("contactForm").addEventListener("submit", function(e){
    e.preventDefault();
    EventProUI.toast("Your message has been sent successfully!", "success");
    e.target.reset();
});