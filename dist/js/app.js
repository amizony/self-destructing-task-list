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

  $scope.$on("data-loaded", function() {
    buildList();
  });

  var buildList = function() {
    setTimeout(function () {
      $scope.$apply(function() {
        $scope.tasks = $scope.taskManagement.getList();
      });
    }, 1);
  };

  $scope.addTask = function() {
    var priority = 2;
    if ($scope.newTaskPriority) {
      switch ($scope.newTaskPriority.toLowerCase()) {
        case "low":
          priority = 3;
          break;
        case "high":
          priority = 1;
          break;
      }
    }
    $scope.taskManagement.createTask($scope.newTaskDescription,priority);

    $scope.newTaskDescription = "";
    $scope.newTaskPriority = "";
  };

  $scope.completeTask = function(task) {
    $scope.taskManagement.validateTask(task.$id);
  };

}]);


taskListApp.controller("PastTask.controller", ["$scope", "TaskManagement", function($scope, TaskManagement) {

  $scope.taskManagement = TaskManagement;

  var buildHistory = function() {
    $scope.history = [];
    var list = $scope.taskManagement.getHistory();
    var ordered = false;
    var reset = false;
    var n = 0;
    // build array of completed and expired tasks
    for (var i = 0; i < list.length; i++) {
      if (list[i].status != "active") {
        $scope.history.push(list[i]);
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
  };

  if (!$scope.history) {
    buildHistory();
  }

}]);


// ---------------------------------
// Service

taskListApp.service("TaskManagement", ["$rootScope", "$firebaseArray", function($rootScope, $firebaseArray) {

  var ref = new Firebase("https://luminous-fire-9311.firebaseio.com/messages");
  var fireBaseTasks = $firebaseArray(ref);

  var intervalID;
  fireBaseTasks.$loaded(function() {
    intervalID = setInterval(clearOldTasks, 1000*60);
    $rootScope.$broadcast("data-loaded");
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
    getList: function() {
      var list = [];
      var n = fireBaseTasks.length;
      console.log(fireBaseTasks);
      console.log(n);
      for (var i = 0; i < n; i++) {
        if (fireBaseTasks[i].status == "active") {
          list.push(fireBaseTasks[i]);
        }
      }
      return list;
    },

    getHistory: function() {
      return fireBaseTasks;
    },

    createTask: function(description,priority) {
      var time = new Date();
      fireBaseTasks.$add({
        desc: description,
        date: time.getTime(),
        status: "active",
        priority: priority
      });
    },

    validateTask: function(id) {
      var time = new Date();
      for (var i = 0; i < fireBaseTasks.length; i++) {
        if (fireBaseTasks[i].$id == id) {
          fireBaseTasks[i].status = "completed";
          fireBaseTasks[i].date = time.getTime();
          fireBaseTasks.$save(i);
        }
      }
    }

  };

}]);

},{}]},{},[1]);