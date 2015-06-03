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

  $scope.addTask = function() {
    var time = new Date();
    $scope.tasks.$add({
      desc: $scope.newTaskDescription,
      date: time.getTime(),
      status: "active",
      priority: "medium"
    });
    $scope.newTaskDescription = "";
  };

  var clearOldTasks = function() {
    var time = new Date();
    for (var i = 0; i < $scope.tasks.length; i++) {
      var age = time.getTime() - $scope.tasks[i].date;
      if (age > 15000) {
        $scope.tasks[i].status = "expired";
      }
    }
  };

  $scope.watchForOldTasks = function() {
    if (!intervalID) {
      intervalID = setInterval(clearOldTasks, 10000);
    }
  };

}]);
