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
  };

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

  var clearOldTasks = function() {
    var time = new Date();
    for (var i = 0; i < $scope.tasks.length; i++) {
      var age = time.getTime() - $scope.tasks[i].date;
      if ((age > oneWeek) && ($scope.tasks[i].status == "active")) {
        $scope.tasks[i].status = "expired";
        $scope.tasks[i].date += oneWeek;
        $scope.tasks.$save(i);
      }
    }
  };

  $scope.watchForOldTasks = function() {
    if (!intervalID) {
      intervalID = setInterval(clearOldTasks, 1000*60);
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

}]);
