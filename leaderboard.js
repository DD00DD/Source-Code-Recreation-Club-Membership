//code reference:
//User: Get Off My Lawn
//URL: https://stackoverflow.com/questions/47918195/creating-a-basic-html-javascript-leaderboard
//Date: Dec 21, 2017
//Accessed: April 11,2024

document.addEventListener('DOMContentLoaded', () => {
    let elements = []
    let container = document.querySelector('#container')
    // Add each row to the array
    container.querySelectorAll('.row').forEach(el => elements.push(el))
    // Clear the container
    container.innerHTML = ''
    // Sort the array from highest to lowest
    elements.sort((a, b) => b.querySelector('.score').textContent - a.querySelector('.score').textContent)
    // Put the elements back into the container
    elements.forEach(e => container.appendChild(e))
  })