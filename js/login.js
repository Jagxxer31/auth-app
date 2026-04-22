$(".field").on("keydown", function (e) {

    if (e.key === "Enter") {
        e.preventDefault();

        let fields = $(".field");
        let index = fields.index(this);

        if (index < fields.length - 1) {
            fields.eq(index + 1).focus();
        } 
        else {
            $("#loginBtn").click();
        }
    }
});

$("#loginBtn").click(function (e) {
    e.preventDefault();

    const email = $("#email").val();
    const password = $("#password").val();

    $.ajax({
        url: "http://localhost:5000/api/login",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({ email, password }),
        success: function (res) {
            localStorage.setItem("token", res.token);
            window.location.href = "profile.html";
        },
        error: function (err) {
            $("#message").text(err.responseJSON.error);
        }
    });

    return false;
});