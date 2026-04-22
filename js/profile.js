$(document).ready(function () {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    function loadProfile() {
        $.ajax({
            url: "/api/profile",
            method: "GET",
            headers: {
                Authorization: "Bearer " + token
            },
            success: function (res) {
                $("#userInfo").html(`
                    <p><span class="labl">Name:</span> ${res.name}</p>
                    <p><span class="labl">Email:</span> ${res.email}</p>
                `);

                $("#dob").val(res.profile?.dob || "");
                $("#contact").val(res.profile?.contact || "");
                $("#address").val(res.profile?.address || "");
            },
            error: function (xhr) {
                localStorage.removeItem("token");
                window.location.href = "login.html";
            }
        });
    }

    $("#save").click(function () {

        $.ajax({
            url: "/api/profile",
            method: "PUT",
            contentType: "application/json",
            headers: {
                Authorization: "Bearer " + token
            },
            data: JSON.stringify({
                dob: $("#dob").val(),
                contact: $("#contact").val(),
                address: $("#address").val()
            }),
            success: function () {
                $("#message").text("Profile updated");
                loadProfile();
            },
            error: function (xhr) {
                $("#message").text(xhr.responseJSON?.error || "Update failed");
            }
        });

    });

    $("#logoutBtn").click(function () {
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });

    loadProfile();
});