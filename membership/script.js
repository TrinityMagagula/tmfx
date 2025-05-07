function toggleMenu() {
    document.querySelector('.nav-links').classList.toggle('active');
}

function logout(event) {
        event.preventDefault();
        signOut(auth).then(() => {
            alert("You have been logged out.");
            window.location.href = "index.html"; // Redirect to home page after alert
        }).catch((error) => {
            console.error("Logout error:", error);
        });
    }

    let inactivityTime = function () {
        let timer;
        window.onload = resetTimer;
        window.onmousemove = resetTimer;
        window.onkeypress = resetTimer;

        function logoutUser() {
            // Call logout directly instead of showing an alert here
            signOut(auth).then(() => {
                alert("You have been logged out.");
                window.location.href = "index.html"; // Redirect after alert
            }).catch((error) => {
                console.error("Logout error:", error);
            });
        }

        function resetTimer() {
            clearTimeout(timer);
            timer = setTimeout(logoutUser, 600000); // Logout after 10 minutes of inactivity
        }
    };

    inactivityTime();

    function logout() {
        alert("You have been logged out.");
    }


    let signedUp = false;

    function signUpForCompetition() {
        if (!signedUp) {
            alert("You have successfully signed up.");
            signedUp = true;
            document.getElementById("competition-button").innerText = "Already Signed Up";
        }
    }

    function goToCompetitionPage() {
        window.location.href = "competition.html";
    }

    function goToMentorshipPage() {
        window.location.href = "../membership/mentorship/mentorship.html";
    }

    function goToSignalsPage() {
        window.location.href = "../membership/signals/signals.html";
    }

    function goToStrategyPage() {
        window.location.href = "../membership/strategy/strategy.html";
    }


    function resetSignUp() {
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        const minute = now.getMinutes();
        if (day === 0 && hour === 0 && minute === 1) {
            signedUp = false;
            document.getElementById("competition-button").innerText = "Sign Up for Competition";
        }
    }

    setInterval(resetSignUp, 60000); // Check every minute