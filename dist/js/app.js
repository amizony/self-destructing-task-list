(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
taskList = angular.module("TaskList", ["ui.router","firebase"]);


// ---------------------------------
// Navigation

taskList.config(["$stateProvider", "$locationProvider", function($stateProvider, $locationProvider) {
  $locationProvider.html5Mode(true);

  $stateProvider.state("home", {
    url: "/",
    controller: "MainController.controller",
    templateUrl: "/templates/home.html"
  });

}]);


// ---------------------------------
// Controller
taskList.controller("MainController.controller", ["$scope", "$firebaseArray", function($scope, $firebaseArray) {

  var ref = new Firebase("https://luminous-fire-9311.firebaseio.com/messages");
  $scope.tasks = $firebaseArray(ref);

  var intervalID;
  var oneWeek = 1000*60*60*24*7;

  $scope.addTask = function() {
    var time = new Date();
    var priority;
    if ($scope.newTaskPriority) {
      priority = $scope.newTaskPriority.toLowerCase();
      console.log(priority);
      switch (priority) {
        case "low":
          priority = 3;
          break;
        case "med":
          priority = 2;
          break;
        case "high":
          priority = 1;
          break;
        default:
          priority = 2;
      }
    } else {
      priority = 2;
    }
    $scope.tasks.$add({
      desc: $scope.newTaskDescription,
      date: time.getTime(),
      status: "active",
      priority: priority
    });

    if (((priority == 1) || (priority == 2)) && ($scope.tasks.length > 1)) {
      insertTask();
    }

    $scope.newTaskDescription = "";
    $scope.newTaskPriority = "";
  };

  var clearOldTasks = function() {
    var time = new Date();
    for (var i = 0; i < $scope.tasks.length; i++) {
      var age = time.getTime() - $scope.tasks[i].date;
      if ((age > oneWeek) && ($scope.tasks[i].status == "active")) {
        $scope.tasks[i].status = "expired";
        $scope.tasks.$save(i);
      }
    }
  };

  $scope.watchForOldTasks = function() {
    if (!intervalID) {
      intervalID = setInterval(clearOldTasks, 1000*60);
    }
  };

  var switchTasks = function(n,m) {
    var temp = $scope.tasks[n];
    $scope.tasks[n] = $scope.tasks[m];
    $scope.tasks[m] = temp;
  };

  var insertTask = function() {
    // take the last task of array (the new added one) and place it at its right place
    var n = $scope.tasks.length;
    var placeFound = false;
    var newPlace = 0;
    console.log("looking for right place");

    // find the right place
    while (!placeFound) {
      console.log("---");
      console.log("place:" + newPlace);
      console.log($scope.tasks[newPlace].priority + "&" + $scope.tasks[n-1].priority);
      if ($scope.tasks[newPlace].priority > $scope.tasks[n-1].priority) {
        placeFound = true;
        console.log("found - " + newPlace);
      } else {
        newPlace += 1;
        if (newPlace == n-1) {
          placeFound = true;
          console.log("found - last");
        }
      }
    }

    // reorder the array
    for (var i = newPlace; i < n-1; i++) {
      switchTasks(i,n-1);
      $scope.tasks.$save(i);
    }
    $scope.tasks.$save(n-1);

  };

}]);

},{}]},{},[1]);