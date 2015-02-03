/**
 * @see http://jsfiddle.net/HzYQn/
 * @see http://stackoverflow.com/questions/17893708/angularjs-textarea-bind-to-json-object-shows-object-object
 */
(function () {
    'use strict';

    angular.module('mappify.jsonBoxDirective', ['mappify.directive'])
        .directive('jsonBox', jsonBox);

    function jsonBox() {

        console.log('jsonBox:called');

        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, element, attr, ngModel) {

                function into(input) {
                    console.log(JSON.parse(input));
                    return JSON.parse(input);
                }
                function out(data) {
                    return JSON.stringify(data, null, 4);
                }
                ngModel.$parsers.push(into);
                ngModel.$formatters.push(out);
            }
        };
    }
})
();
