(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
taskListApp = angular.module("TaskListApp", ["ui.router","firebase"]);


// ---------------------------------
// Navigation

taskListApp.config(["$stateProvider", "$locationProvider", function($stateProvider, $locationProvider) {
  $locationProvider.html5Mode(true);

  $stateProvider.state("home", {
    url: "/",
    controller: "ActiveTask.controller",
    templateUrl: "/templates/home.html"
  });

  $stateProvider.state("history", {
    url: "/history",
    controller: "PastTask.controller",
    templateUrl: "/templates/history.html"
  });

}]);


// ---------------------------------
// Controllers

taskListApp.controller("ActiveTask.controller", ["$scope", "TaskManagement", function($scope, TaskManagement) {

  $scope.taskManagement = TaskManagement;

  $scope.tasks = $scope.taskManagement.taskList;

}]);


taskListApp.controller("PastTask.controller", ["$scope", "TaskManagement", function($scope, TaskManagement) {

  $scope.taskManagement = TaskManagement;

  $scope.tasks = $scope.taskManagement.taskList;

}]);


// ---------------------------------
// Service

taskListApp.service("TaskManagement", ["$rootScope", "$firebaseArray", function($rootScope, $firebaseArray) {

  var ref = new Firebase("https://luminous-fire-9311.firebaseio.com/messages");
  var fireBaseTasks = $firebaseArray(ref);

  var intervalID;
  fireBaseTasks.$loaded(function() {
    intervalID = setInterval(clearOldTasks, 1000*60);
  });

  var oneWeek = 1000*60*60*24*7;


  var clearOldTasks = function() {
    var time = new Date();
    console.log("-- Looking for old tasks --");
    for (var i = 0; i < fireBaseTasks.length; i++) {
      var age = time.getTime() - fireBaseTasks[i].date;
      if ((age > oneWeek) && (fireBaseTasks[i].status == "active")) {
        fireBaseTasks[i].status = "expired";
        fireBaseTasks[i].date += oneWeek;
        fireBaseTasks.$save(i);
      }
    }
  };


  return {
    taskList: fireBaseTasks,

    addTask: function() {

    },

    completeTask: function() {

    },


  };

  /*
  $scope.addTask = function() {
    var time = new Date();
    var priority;
    if ($scope.newTaskPriority) {
      priority = $scope.newTaskPriority.toLowerCase();
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

    $scope.newTaskDescription = "";
    $scope.newTaskPriority = "";
  }

  $scope.completeTask = function(task) {
    var time = new Date();

    task.status = "completed";
    task.date = time.getTime();

    for (var i = 0; i < $scope.tasks.length; i++) {
      if ($scope.tasks[i].date == task.date) {
        $scope.tasks.$save(i);
      }
    }
  };



  $scope.buildHistory = function() {
    $scope.history = [];
    var ordered = false;
    var reset = false;
    var n = 0;
    // build array of completed and expired tasks
    for (var i = 0; i < $scope.tasks.length; i++) {
      if ($scope.tasks[i].status != "active") {
        $scope.history.push($scope.tasks[i]);
      }
    }

    // order the history
    while (!ordered) {
      if ($scope.history[n].date > $scope.history[n+1].date) {
        var temp = $scope.history[n];
        $scope.history[n] = $scope.history[n+1];
        $scope.history[n+1] = temp;
        reset = true;
      }
      n += 1;
      if (n == $scope.history.length - 1) {
        if (reset) {
          n = 0;
          reset = false;
        } else {
          ordered = true;
        }
      }
    }

    // show the history
    $scope.showHistory = true;
  };
*/
}]);

},{}]},{},[1]);