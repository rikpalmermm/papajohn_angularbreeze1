(function () {
    'use strict';

    var serviceId = 'datacontext';
    angular.module('app').factory(serviceId,
        ['common', 'entityManagerFactory', 'config', 'model', datacontext]);

    function datacontext(common, emFactory, config, model) {
        var EntityQuery = breeze.EntityQuery;
        var entityNames = model.entityNames;
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(serviceId);
        var logError = getLogFn(serviceId, 'error');
        var logSuccess = getLogFn(serviceId, 'success');
        var manager = emFactory.newManager();
        var primePromise;
        var $q = common.$q;

        var storeMeta = {
            isLoaded: {
                sessions: false,
                attendees: false
            }
        };

        var service = {
            getPeople: getPeople,
            getMessageCount: getMessageCount,
            getAttendeesCount: getAttendeesCount,
            getSpeakersCount: getSpeakersCount,
            getSessionsCount: getSessionsCount,
            getSessionPartials: getSessionPartials,
            getSpeakerPartials: getSpeakerPartials,
            getAttendees: getAttendees,
            prime: prime
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

        function getAttendees(forceRefresh) {
            var orderBy = 'firstName, lastName';
            var attendees = [];

            if (_areAttendeesLoaded() && !forceRefresh) {
                attendees = _getAllLocal(entityNames.attendee, orderBy);
                _areAttendeesLoaded(true);
                return $q.when(attendees);
            }

            return EntityQuery.from('Persons')
                .select('id, firstName, lastName, imageSource')
                .orderBy(orderBy)
                .toType(entityNames.person)
                .using(manager).execute()
                .then(querySucceeded).catch(_queryFailed);

            function querySucceeded(data) {
                attendees = data.results;
                _areAttendeesLoaded(true);
                log('Retrieved [Attendees] from remote data source', attendees.length, true);
                return attendees;
            }
        }

        function getAttendeesCount() {
            return EntityQuery.from('Persons').take(0).inlineCount()
            .using(manager).execute().then(gotAttendees).catch(_queryFailed);

            function gotAttendees(data) {
                return data.inlineCount;
            }
        }

        function getSpeakersCount() {
            return EntityQuery.from('Speakers').take(0).inlineCount()
            .using(manager).execute().then(gotSpeakers).catch(_queryFailed);

            function gotSpeakers(data) {
                return data.inlineCount;
            }
        }

        function getSessionsCount() {
            return EntityQuery.from('Sessions').take(0).inlineCount()
            .using(manager).execute().then(gotSessions).catch(_queryFailed);

            function gotSessions(data) {
                return data.inlineCount;
            }
        }

        function getSpeakerPartials(forceRefresh) {
            var predicate = breeze.Predicate.create('isSpeaker', '==', true)
            var speakersOrderBy = 'firstName, lastName';
            var speakers = [];

            if (!forceRefresh) {
                speakers = _getAllLocal(entityNames.speaker, speakersOrderBy, predicate);
                return $q.when(speakers);
            }

            return EntityQuery.from('Speakers')
                .select('id, firstName, lastName, imageSource')
                .orderBy(speakersOrderBy)
                .toType(entityNames.speaker)
                .using(manager).execute()
                .then(querySucceeded).catch(_queryFailed);

            function querySucceeded(data) {
                speakers = data.results;
                for (var i = speakers.length; i--;) {
                    speakers[i].isSpeaker = true;
                }
                log('Retrieved [Speaker Partials] from remote data source', speakers.length, true);
                return speakers;
            }
        }

        function getSessionPartials(forceRefresh) {
            var orderBy = 'timeSlotId, level, speaker.firstName';
            var sessions;

            if (_areSessionsLoaded() && !forceRefresh) {
                sessions = _getAllLocal(entityNames.session, orderBy);
                return $q.when(sessions);
            }

            return EntityQuery.from('Sessions')
                .select('id, title, code, speakerId, trackId, timeSlotId, roomId, level, tags')
                .orderBy(orderBy)
                .toType(entityNames.session)
                .using(manager).execute()
                .then(querySucceeded).catch(_queryFailed);

            function querySucceeded(data) {
                sessions = data.results;
                _areSessionsLoaded(true);
                log('Retrieved [Session Partials] from remote data source', sessions.length, true);
                return sessions;
            }
        }

        function prime() {

            if (primePromise) return primePromise;

            primePromise = $q.all([getLookups(), getSpeakerPartials(true)])
                .then(extendMetaData)
                .then(success);

            return primePromise;

            function success() {
                setLookups();
                log('Primed the data');
            }

            function extendMetaData() {
                var metadatastore = manager.metadataStore;
                var types = metadatastore.getEntityTypes();
                types.forEach(function(type) {
                    if (type instanceof breeze.EntityType) {
                        set(type.shortName, type);
                    }
                });

                var personEntityName = entityNames.person;
                ['Speakers', 'Speaker', 'Attendees', 'Attendee'].forEach(function(r) {
                    set(r, personEntityName);
                })

                function set(resourceName, entityName) {
                    metadatastore.setEntityTypeForResourceName(resourceName, entityName);
                }
            }
        }

        function setLookups() {

            service.lookupCachedData = {
                rooms: _getAllLocal(entityNames.room, 'name'),
                tracks: _getAllLocal(entityNames.track, 'name'),
                timeslots: _getAllLocal(entityNames.timeslot, 'start')
            };
        }

        function _getAllLocal(resource, ordering, predicate) {
            return EntityQuery.from(resource)
                .orderBy(ordering)
                .where(predicate)
                .using(manager)
                .executeLocally();
        }

        function getLookups() {
            return EntityQuery.from('Lookups')
            .using(manager).execute()
            .then(querySucceeded).catch(_queryFailed);

            function querySucceeded(data) {
                log('Retrieved [Lookups]', data, true);
                return true;
            }
        }


        function _queryFailed(error) {
            var msg = config.appErrorPrefix = 'Error retrieveing data.' + error.message;
            logError(msg, error);
            throw error;
        }

        function _areSessionsLoaded (value) {
            return _areItemsLoaded('sessions', value);
        }

        function _areAttendeesLoaded(value) {
            return _areItemsLoaded('attendees', value);
        }

        function _areItemsLoaded(key, value) {
            if (value === undefined) {
                return storeMeta.isLoaded[key]; // get
            }
            return storeMeta.isLoaded[key] = value; // set
        }
        
    }
})();