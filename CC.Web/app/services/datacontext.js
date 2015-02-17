(function () {
    'use strict';

    var serviceId = 'datacontext';
    angular.module('app').factory(serviceId, ['common', 'entityManagerFactory', datacontext]);

    function datacontext(common, emFactory) {
        var $q = common.$q;
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(serviceId);
        var logError = getLogFn(serviceId, 'error');
        var logSuccess = getLogFn(serviceId, 'success');
        var EntityQuery = breeze.EntityQuery;
        var manager = emFactory.newManager();

        var service = {
            getPeople: getPeople,
            getMessageCount: getMessageCount,
            getSessionPartials : getSessionPartials
        };

        return service;

        function getMessageCount() { return $q.when(72); }

        function getPeople() {
            var people = [
                { firstName: 'John', lastName: 'Papa', age: 25, location: 'Florida' },
                { firstName: 'Ward', lastName: 'Bell', age: 31, location: 'California' },
                { firstName: 'Colleen', lastName: 'Jones', age: 21, location: 'New York' },
                { firstName: 'Madelyn', lastName: 'Green', age: 18, location: 'North Dakota' },
                { firstName: 'Ella', lastName: 'Jobs', age: 18, location: 'South Dakota' },
                { firstName: 'Landon', lastName: 'Gates', age: 11, location: 'South Carolina' },
                { firstName: 'Haley', lastName: 'Guthrie', age: 35, location: 'Wyoming' }
            ];
            return $q.when(people);
        }

        function getSessionPartials() {
            var sessions;

            //sessions = [
            //    { title: 'First Session', id: 1, level: '25th floor', timeSlotId: '2:00pm', speakerId: 12 },
            //    { title: 'Second session', id: 2, level: '3rd floor', timeSlotId: '3:30pm', speakerId: 22 }
            //];
            //return $q.when(sessions);

            var results = EntityQuery.from('Sessions')
                .select('id,title,code,speakerId,trackId,timeSlotId,roomId,level')
                .toType('Session')
                .orderBy('timeSlotId,level')
                .using(manager).execute()
                .to$q(querySucceeded, _queryFailed);

            console.log('RESULTS:', results);
            return results;

            function querySucceeded(data) {
                sessions = data.results;
                log('Got some sesh', sessions);
            }

            function _queryFailed(error) {
                var msg = config.appErrorPrefix + 'error retrieving data. ' + error.message;
                logError(msg, error);
                throw error;
            }
        }
    }
})();