taskList = angular.module('TaskList', ['ui.router','firebase']);


// ---------------------------------
// Navigation

taskList.config(['$stateProvider', '$locationProvider', function($stateProvider, $locationProvider) {
  $locationProvider.html5Mode(true);

  $stateProvider.state('home', {
    url: '/',
    controller: 'MainController.controller',
    templateUrl: '/templates/home.html'
  });

}]);


// ---------------------------------
// Controller
taskList.controller('MainController.controller', ['$scope', function($scope) {

}]);
