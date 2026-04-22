$(document).ready(function () {

    $(".field").on("keydown", function (e) {

        if (e.key === "Enter") {
            e.preventDefault();

            let fields = $(".field");
            let index = fields.index(this);

            if (index < fields.length - 1) {
                fields.eq(index + 1).focus();
            } else {
                $("#registerBtn").click();
            }
        }
    });

    $("#registerBtn").click(function () {

        const name = $("#name").val().trim();
        const email = $("#email").val().trim();
        const password = $("#password").val().trim();

        if (!name || !email || !password) {
            $("#message").text("Please fill all fields");
            return;
        }

        $.ajax({
            url: "/api/register",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ name, email, password }),

            success: function () {
                $("#message")
                    .css("color", "green")
                    .text("Registered successfully");

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 800);
            },

            error: function (err) {
                $("#message")
                    .css("color", "red")
                    .text(err.responseJSON?.error || "Registration failed");
            }
        });
    });

});