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
    $scope.tasks.push({
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
    updatingTasks();
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

    // find the right place
    while (!placeFound) {
      if ($scope.tasks[newPlace].priority > $scope.tasks[n-1].priority) {
        placeFound = true;
      } else {
        newPlace += 1;
        if (newPlace == n-1) {
          placeFound = true;
        }
      }
    }

    // reorder the array
    for (var i = newPlace; i < n-1; i++) {
      switchTasks(i,n-1);
    }
  };

  var updatingTasks = function() {
    var n = $scope.tasks.length;
    for (var i = 0; i < n - 1; i++) {
      $scope.tasks.$save(i);
    }
    $scope.tasks.$add($scope.tasks.pop());
  };

}]);
