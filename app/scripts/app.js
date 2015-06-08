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

  if (!$scope.tasks) {
    console.log("no local tasks");
  }

  var buildList = function() {
    $scope.tasks = $scope.taskManagement.taskList;
  };

  if (!$scope.tasks) {
    buildList();
  }

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

}]);


taskListApp.controller("PastTask.controller", ["$scope", "TaskManagement", function($scope, TaskManagement) {

  $scope.taskManagement = TaskManagement;

  var buildHistory = function() {
    $scope.history = [];
    var ordered = false;
    var reset = false;
    var n = 0;
    // build array of completed and expired tasks
    for (var i = 0; i < $scope.taskManagement.taskList.length; i++) {
      if ($scope.taskManagement.taskList[i].status != "active") {
        $scope.history.push($scope.taskManagement.taskList[i]);
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

    createTask: function(description,priority) {
      var time = new Date();
      fireBaseTasks.$add({
        desc: description,
        date: time.getTime(),
        status: "active",
        priority: priority
      });
    },

    completeTask: function() {

    },


  };

  /*

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

  };
*/
}]);
