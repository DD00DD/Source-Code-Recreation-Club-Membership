function toggleNotification(){
    var box = document.getElementById('box');
    box.style.visibility = "visible";
}

function closeNotification(){
    var box = document.getElementById('box');
    box.style.visibility = "hidden";
}

var currentIndex = 1;
const original = document.getElementById("tb").innerHTML;

function coverNextNumber() {
    var currentCell = document.getElementById("num" + currentIndex);
    if (currentCell) {
        currentCell.textContent = 'X';
        currentCell.classList.add('covered');
        currentIndex++;
    }

    if(!currentCell && currentIndex > 10){
        var tb = document.getElementById("tb");
        currentIndex = 1;
        tb.innerHTML = original;
    }
}