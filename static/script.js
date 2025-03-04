document.addEventListener("DOMContentLoaded", function () {
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    const body = document.body;

    darkModeToggle.addEventListener("click", function () {
        body.classList.toggle("dark-mode");
        localStorage.setItem("darkMode", body.classList.contains("dark-mode"));
    });

    // Load Dark Mode Preference
    if (localStorage.getItem("darkMode") === "true") {
        body.classList.add("dark-mode");
    }

    // Infinite Looping Carousel
    const carouselWrapper = document.querySelector(".carousel-wrapper");
    let slides = document.querySelectorAll(".carousel");
    const prevButton = document.getElementById("prevButton");
    const nextButton = document.getElementById("nextButton");

    let index = 1; // Start from first real slide
    const totalItems = slides.length;
    const slideWidth = slides[0].offsetWidth;

    // Clone all slides for smooth infinite looping
    slides.forEach(slide => {
        const clone = slide.cloneNode(true);
        carouselWrapper.appendChild(clone);
    });

    slides.forEach(slide => {
        const clone = slide.cloneNode(true);
        carouselWrapper.insertBefore(clone, slides[0]);
    });

    // Update slides list after cloning
    slides = document.querySelectorAll(".carousel");

    // Set initial position
    carouselWrapper.style.transform = `translateX(-${index * slideWidth}px)`;

    function updateCarousel() {
        carouselWrapper.style.transition = "transform 0.5s ease-in-out";
        carouselWrapper.style.transform = `translateX(-${index * slideWidth}px)`;
    }

    nextButton.addEventListener("click", () => {
        index++;
        updateCarousel();
        if (index >= slides.length - totalItems) {
            setTimeout(() => {
                carouselWrapper.style.transition = "none";
                index = totalItems;
                carouselWrapper.style.transform = `translateX(-${index * slideWidth}px)`;
            }, 500);
        }
    });

    prevButton.addEventListener("click", () => {
        index--;
        updateCarousel();
        if (index < totalItems) {
            setTimeout(() => {
                carouselWrapper.style.transition = "none";
                index = slides.length - (totalItems * 2);
                carouselWrapper.style.transform = `translateX(-${index * slideWidth}px)`;
            }, 500);
        }
    });
    
    document.querySelector(".input-form").addEventListener("submit", function(event) {
        event.preventDefault(); // Prevent page reload

        const email = document.querySelector("#email").value;

        fetch("/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email })
        })
        .then(response => response.json())
        .then(data => alert("Subscribed successfully!"))
        .catch(error => alert("Error subscribing"));
    });

    document.querySelectorAll("details").forEach((detail) => {
        const content = detail.querySelector(".faq-answer");
    
        detail.addEventListener("toggle", function () {
            if (detail.open) {
                content.style.display = "block"; // Ensure it's visible
                content.style.maxHeight = content.scrollHeight + "px";
                content.style.opacity = "1";
    
                setTimeout(() => {
                    content.style.maxHeight = "none"; // Prevents sudden closing when resized
                }, 500);
            } else {
                content.style.maxHeight = content.scrollHeight + "px"; // Set to current height first
                content.style.opacity = "1";
    
                setTimeout(() => {
                    content.style.maxHeight = "0";
                    content.style.opacity = "0";
                }, 10);
    
                setTimeout(() => {
                    content.style.display = "none"; // Ensures smooth closing without flickering
                }, 500);
            }
        });
    });             
});
