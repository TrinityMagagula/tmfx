document.addEventListener('contextmenu', e => e.preventDefault());
      
document.addEventListener('keydown', function (e) {
if (e.key === "PrintScreen") {
e.preventDefault();
alert("Screenshots are disabled.");
}
});
