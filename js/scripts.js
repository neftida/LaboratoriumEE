(function () {

    var allUsers, activeUsers, activeWomen, activeMen, last6monthLogins, sortedUsers;
    var jsonURL = "api/users.json";

    // ajax promise
    var get = function (url) {
        return new Promise(function (resolve, reject) {
            var req = new XMLHttpRequest();
            req.open('GET', url);
            req.onload = function () {
                if (req.status == 200) {
                    resolve(req.response);
                }
                else {
                    reject(Error(req.statusText));
                }
            };
            req.onerror = function () {
                reject(Error("Error"));
            };
            req.send();
        });
    };

    // users sorting by name
    var sort = function(users){
        var sorted;
        sorted = users.sort(function(a,b) {
            var x, y;
            x = (a.last_name || "-").toLowerCase();
            y = (b.last_name || "-").toLowerCase();
            return (x < y) ? -1 : ((x > y) ? 1 : 0)
        });
        return sorted;
    }

    // display google map
    var initMap = function(latitude, longitude) {
        document.getElementById("map").style.display = "none";
        if (latitude && longitude) {
            document.getElementById("map").style.display = "block";
            var point = {lat: parseFloat(latitude), lng: parseFloat(longitude)};
            var map = new google.maps.Map(document.getElementById('map'), {
                zoom: 14,
                center: point
            });
            var marker = new google.maps.Marker({
                position: point,
                map: map
            });
        }
    }

    // display main data + users list
    var displayData = function () {
        var tableContent = "";
        document.getElementById("allUsers").innerHTML = allUsers.length;
        document.getElementById("activeUsers").innerHTML = activeUsers.length;
        document.getElementById("activeWomen").innerHTML = activeWomen.length;
        document.getElementById("activeMen").innerHTML = activeMen.length;
        document.getElementById("last6monthLogins").innerHTML = last6monthLogins.length;
        for(i in sortedUsers)
        {
            let lp = parseInt(i) + 1;
            let userId = sortedUsers[i].id || "-";
            let userFirstName = sortedUsers[i].first_name || "-";
            let userLastName = sortedUsers[i].last_name || "-";
            let userLogin = sortedUsers[i].username || "";
            tableContent += "<tr id='userId_" + userId + "'><td>" + lp + "</td><td>" + userFirstName + "</td><td>" + userLastName + "</td><td>" + userLogin + "</td></tr>";
        }
        document.getElementById("users").innerHTML = tableContent;
    };

    // show modal and display properties
    var showModal = function(row) {
        return function() {
            var id = row.id.split("_")[1];
            var selectedUser = activeUsers.filter(entry => entry.id == id)[0];
            var imageContainer = document.getElementById("userAvatar");
            var userLoginContainer = document.getElementById("userLogin");
            var userFullNameContainer = document.getElementById("fullUserName");
            var userEmailContainer = document.getElementById("userEmail");
            var userCityContainer = document.getElementById("userCity");
            var modalLayer = document.getElementById("modalLayer");
            var modalContent = document.getElementById("modalContent");
            if (selectedUser.avatar)
                imageContainer.innerHTML = "<img src='" + selectedUser.avatar +"' />";
            userLoginContainer.innerHTML = selectedUser.username;
            userFullNameContainer.innerHTML = (selectedUser.first_name || "") + " " + (selectedUser.last_name || "");
            if (selectedUser.email)
                userEmailContainer.innerHTML = "<a href='mailto:" + selectedUser.email +"'>" + selectedUser.email + "</a>";
            var favouriteColor = selectedUser.favorites.color || "#000";
            modalLayer.style.backgroundColor = favouriteColor;
            modalLayer.style.display = "block";
            modalContent.style.display = "block";
            initMap(selectedUser.coordinates.lat, selectedUser.coordinates.lng);
            var googleApi = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + selectedUser.coordinates.lat + "," + selectedUser.coordinates.lng + "&sensor=true";
            get(googleApi).then(function (response) {
                var data = JSON.parse(response);
                var city;
                if (data['results'][0].address_components['1'].long_name) {
                    city = data['results'][0].address_components['1'].long_name;
                }
                else {
                    city = "-";
                }
                userCityContainer.innerHTML = city;
            }, function (error) {
                alert("Failed!", error);
            });
            document.getElementById("closeModal").onclick = function () {
                modalContent.style.display = "none";
                modalLayer.style.display = "none";
                imageContainer.innerHTML = userLoginContainer.innerHTML = userFullNameContainer.innerHTML = userCityContainer.innerHTML = "";
            }
        };
    };

    // click event on table rows
    var tableRowHandlers = function() {
        var table = document.getElementById("users");
        var rows = table.getElementsByTagName("tr");
        for (i = 0; i < rows.length; i++) {
            var currentRow = table.rows[i];
            currentRow.onclick = showModal(currentRow);
        }
    }

    // main
    get(jsonURL).then(function (response) {
        allUsers = JSON.parse(response);
        activeUsers = allUsers.filter(entry => entry.active);
        activeWomen = activeUsers.filter(entry => entry.gender.includes("Female"));
        activeMen = activeUsers.filter(entry => entry.gender.includes("Male"));
        last6monthLogins = activeUsers.filter(function(entry) {
            var dateNumber = Date.parse(entry.last_login);
            var currentDate = new Date();
            var requiredDate = currentDate.setMonth(currentDate.getMonth() - 6);
            return dateNumber >= requiredDate;
        });
        sortedUsers = sort(activeUsers);
    }, function (error) {
        alert("Failed!", error);
    }).then(function () {
        displayData();
    }).then(function () {
        tableRowHandlers();
    });

})();