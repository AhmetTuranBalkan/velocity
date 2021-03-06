/*
Copyright (C) 2018
Developed at University of Toronto

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

"use strict";

const common = require('../common.js');
const db = require('../db.js');

var nextTicketId = 1;

/**
 * initialize the ticket
 *
 * @param {function} callback callback function
 */
const initialize = function (callback) {
    getLimitedTicketsListSorted({}, {}, 0, function (err, ticketsList) {
        if (err) {
            return callback(err, null);
        }

        nextTicketId += ticketsList.length;
        return callback(null, 'ok');
    });
}

/**
 * Create a ticket
 *
 * @param {object} ticket ticket object to add
 * @param {function} callback callback function
 */
const addTicket = function (ticket, callback) {
    if (typeof (ticket.title) !== common.variableTypes.STRING
        || typeof (ticket.description) !== common.variableTypes.STRING
        || typeof (ticket.projectId) !== common.variableTypes.STRING
        || typeof (ticket.teamId) !== common.variableTypes.STRING
        || typeof (ticket.reporter) !== common.variableTypes.STRING
        || !common.isValueInObjectWithKeys(ticket.priority, 'value', common.ticketPriority)
        || !common.isValueInObjectWithKeys(ticket.state, 'value', common.ticketStates)
        || !common.isValueInObjectWithKeys(ticket.type, 'value', common.ticketTypes)
        || common.isEmptyString(ticket.title)
        || common.isEmptyString(ticket.description)) {
        return callback(common.getError(7006), null);
    }

    const currentDate = common.getDate();
    const currentISODate = common.getISODate();
    let ticketToAdd = {};

    ticketToAdd._id = common.getUUID();
    ticketToAdd.ctime = currentDate;
    ticketToAdd.mtime = currentDate;
    ticketToAdd.ictime = currentISODate;
    ticketToAdd.imtime = currentISODate;
    ticketToAdd.displayId = `TICKET-${nextTicketId++}`;
    ticketToAdd.projectId = ticket.projectId;
    ticketToAdd.teamId = ticket.teamId;
    ticketToAdd.sprints = Array.isArray(ticket.sprints) ? ticket.sprints : [];
    ticketToAdd.releases = Array.isArray(ticket.releases) ? ticket.releases : [];
    ticketToAdd.tags = Array.isArray(ticket.tags) ? ticket.tags : [];
    ticketToAdd.links = Array.isArray(ticket.links) ? ticket.links : [];
    ticketToAdd.attachments = Array.isArray(ticket.attachments) ? ticket.attachments : [];
    ticketToAdd.milestoneTickets = Array.isArray(ticket.milestoneTickets) ? ticket.milestoneTickets : [];
    ticketToAdd.title = ticket.title;
    ticketToAdd.description = ticket.description;
    ticketToAdd.status = common.ticketStatus.ACTIVE.value;
    ticketToAdd.state = ticket.state;
    ticketToAdd.type = ticket.type;
    ticketToAdd.reporter = ticket.reporter;
    ticketToAdd.priority = ticket.priority;
    ticketToAdd.assignee = typeof (ticket.assignee) === common.variableTypes.STRING ? ticket.assignee : common.noAssignee;
    ticketToAdd.points = typeof (ticket.points) === common.variableTypes.NUMBER ? ticket.points : common.defaultPoints;
    ticketToAdd.stateHistory = [];
    ticketToAdd.assigneeHistory = [];
    ticketToAdd.inBacklog = typeof (ticket.inBacklog) === common.variableTypes.BOOLEAN ? ticket.inBacklog : true;
    ticketToAdd.milestone = typeof (ticket.milestone) === common.variableTypes.STRING ? ticket.milestone : '';

    db.addTicket(ticketToAdd, callback);
}

/**
 * get tickets list with search, sort and limit params
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit on the results list length
 * @param {function} callback callback function
 */
const getLimitedTicketsListSorted = function (searchQuery, sortQuery, lim, callback) {
    db.getLimitedTicketsListSorted(searchQuery, sortQuery, lim, callback);
}

/**
 * find a single ticket by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getTicket = function (searchQuery, callback) {
    db.getTicket(searchQuery, callback);
}

/**
 * find team's list of tickets
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {function} callback callback function
 */
const getTicketsByTeamId = function (projectId, teamId, callback) {
    getLimitedTicketsListSorted({ $and: [{ projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }] }, { title: 1 }, 0, callback);
}

/**
 * find project's list of tickets
 *
 * @param {string} projectId project id
 * @param {function} callback callback function
 */
const getTicketsByProjectId = function (projectId, callback) {
    getLimitedTicketsListSorted({ $and: [{ projectId: projectId }, { status: common.ticketStatus.ACTIVE.value }] }, { title: 1 }, 0, callback);
}

/**
 * Find all tickets to a list of project ids
 *
 * @param {string} projectIds project ids
 * @param {function} callback callback function
 */
const getTicketsByProjectIds = function (projectIds, callback) {
    let projectIdsList = [];
    for (let i = 0; i < projectIds.length; i++) {
        projectIdsList.push({ projectId: projectIds[i] });
    }

    if (projectIds.length === 0) {
        return callback(null, []);
    }

    getLimitedTicketsListSorted({ $and: [{ $or: projectIdsList }, { status: common.ticketStatus.ACTIVE.value }] }, { title: 1 }, 0, callback);
}

/**
 * find a milestone
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {string} milestoneId milestone id
 * @param {function} callback callback function
 */
const getMilestoneById = function (projectId, teamId, milestoneId, callback) {
    getTicket({ $and: [{ _id: milestoneId }, { projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }, { type: common.ticketTypes.MILESTONE.value }] }, callback);
}

/**
 * find a ticket
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {string} ticketId ticket id
 * @param {function} callback callback function
 */
const getTicketById = function (projectId, teamId, ticketId, callback) {
    getTicket({ $and: [{ _id: ticketId }, { projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }] }, callback);
}

/**
 * find a ticket by its display id
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {string} ticketDisplayId ticket display id
 * @param {function} callback callback function
 */
const getTicketByDisplayId = function (projectId, teamId, ticketDisplayId, callback) {
    getTicket({ $and: [{ displayId: ticketDisplayId }, { projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }] }, callback);
}

/**
 * find the list of tickets under a team
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {array} ticketsIds tickets ids
 * @param {function} callback callback function
 */
const getTicketsByIds = function (projectId, teamId, ticketsIds, callback) {
    let ticketsIdsList = [];
    for (let i = 0; i < ticketsIds.length; i++) {
        ticketsIdsList.push({ _id: ticketsIds[i] });
    }

    if (ticketsIds.length === 0) {
        return callback(null, []);
    }

    getLimitedTicketsListSorted({ $and: [{ $or: ticketsIdsList }, { projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }] }, { title: 1 }, 0, callback);
}

/**
 * add milestone to list of tickets
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {string} milestoneId milestone id
 * @param {array} ticketsIds tickets ids
 * @param {function} callback callback function
 */
const addMilestoneToTickets = function (projectId, teamId, milestoneId, ticketsIds, callback) {
    let ticketsIdsList = [];
    for (let i = 0; i < ticketsIds.length; i++) {
        ticketsIdsList.push({ _id: ticketsIds[i] });
    }

    if (ticketsIds.length === 0) {
        return callback(null, []);
    }

    updateTickets(
        { $and: [{ $or: ticketsIdsList }, { projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }] },
        { $set: { mtime: common.getDate(), imtime: common.getISODate(), milestone: milestoneId } },
        callback);
}

/**
 * remove milestone from list of tickets
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {array} ticketsIds tickets ids
 * @param {function} callback callback function
 */
const removeMilestoneFromTickets = function (projectId, teamId, ticketsIds, callback) {
    let ticketsIdsList = [];
    for (let i = 0; i < ticketsIds.length; i++) {
        ticketsIdsList.push({ _id: ticketsIds[i] });
    }

    if (ticketsIds.length === 0) {
        return callback(null, []);
    }

    updateTickets(
        { $and: [{ $or: ticketsIdsList }, { projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }] },
        { $set: { mtime: common.getDate(), imtime: common.getISODate(), milestone: '' } },
        callback);
}

/**
 * remove ticket from milestones list
 * 
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {string} ticketId ticket id
 * @param {function} callback callback function
 */
const removeTicketFromMilestones = function (projectId, teamId, ticketId, callback) {
    updateTickets(
        { $and: [{ projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }] },
        { $set: { mtime: common.getDate(), imtime: common.getISODate() }, $pull: { milestoneTickets: ticketId } },
        callback);
}

/**
 * remove tickets from milestones list
 * 
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {array} ticketIdsList ticket ids list
 * @param {function} callback callback function
 */
const removeTicketsFromMilestones = function (projectId, teamId, ticketIdsList, callback) {
    updateTickets(
        { $and: [{ projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }, { type: common.ticketTypes.MILESTONE.value }] },
        { $set: { mtime: common.getDate(), imtime: common.getISODate() }, $pull: { milestoneTickets: { $in: ticketIdsList } } },
        callback);
}

/**
 * find the list of tickets with no sprints
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {function} callback callback function
 */
const getTicketsWithNoSprints = function (projectId, teamId, callback) {
    getLimitedTicketsListSorted({ $and: [{ sprints: { $size: 0 } }, { projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }] }, { title: 1 }, 0, callback);
}

/**
 * find the list of tickets in backlog
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {function} callback callback function
 */
const getTicketsInBacklog = function (projectId, teamId, callback) {
    getLimitedTicketsListSorted({ $and: [{ inBacklog: true }, { projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }] }, { title: 1 }, 0, callback);
}

/**
 * find tickets under a sprint
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {string} sprintId sprint id
 * @param {function} callback callback function
 */
const getTicketsBySprintId = function (projectId, teamId, sprintId, callback) {
    getTicket({ $and: [{ sprintId: sprintId }, { projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }] }, callback);
}

/**
 * search for tickets in a project
 *
 * @param {string} projectId project id
 * @param {string} term search term
 * @param {function} callback callback function
 */
const searchTicketsByProjectId = function (projectId, term, callback) {
    getLimitedTicketsListSorted(
        {
            $and: [
                {
                    $or: [
                        {
                            displayId: { $regex: `(.*)${term}(.*)`, $options: 'i' }
                        }, {
                            title: { $regex: `(.*)${term}(.*)`, $options: 'i' }
                        }, {
                            description: { $regex: `(.*)${term}(.*)`, $options: 'i' }
                        }
                    ]
                }, {
                    projectId: projectId
                }, {
                    status: common.ticketStatus.ACTIVE.value
                }
            ]
        },
        {
            title: 1
        },
        0,
        callback
    );
}

/**
 * search for tickets in a team
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {string} term search term
 * @param {function} callback callback function
 */
const searchTicketsByTeamId = function (projectId, teamId, term, callback) {
    getLimitedTicketsListSorted(
        {
            $and: [
                {
                    $or: [
                        {
                            displayId: { $regex: `(.*)${term}(.*)`, $options: 'i' }
                        }, {
                            title: { $regex: `(.*)${term}(.*)`, $options: 'i' }
                        }, {
                            description: { $regex: `(.*)${term}(.*)`, $options: 'i' }
                        }
                    ]
                }, {
                    projectId: projectId
                }, {
                    teamId: teamId
                }, {
                    status: common.ticketStatus.ACTIVE.value
                }
            ]
        },
        {
            title: 1
        },
        0,
        callback
    );
}

/**
 * set the backlog flag true for the list of ticket Ids
 *
 * @param {array} ticketIdsList ticket ids list
 * @param {function} callback callback function
 */
const putTicketsInBacklog = function (projectId, teamId, ticketIdsList, callback) {
    let idsList = [];
    for (let i = 0; i < ticketIdsList.length; i++) {
        idsList.push({ _id: ticketIdsList[i] });
    }

    if (ticketIdsList.length === 0) {
        return callback(null, 'ok');
    }

    updateTickets(
        { $and: [{ $or: idsList }, { projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }, { state: { $ne: common.ticketStates.DONE.value } }] },
        { $set: { mtime: common.getDate(), imtime: common.getISODate(), inBacklog: true } },
        callback);
}

/**
 * update ticket found by the search query
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateTicket = function (searchQuery, updateQuery, callback) {
    db.updateTicket(searchQuery, updateQuery, callback);
}

/**
 * update tickets found by the search query
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateTickets = function (searchQuery, updateQuery, callback) {
    db.updateTickets(searchQuery, updateQuery, callback);
}

/**
 * update the ticket information
 *
 * @param {string} ticketId ticket id
 * @param {string} teamId team id
 * @param {string} projectId project id
 * @param {object} updateParams modify parameters
 * @param {function} callback callback function
 */
const updateTicketById = function (ticketId, teamId, projectId, updateParams, callback) {
    let searchQuery = {};
    searchQuery.$and = {};
    let updateQuery = {};
    updateQuery.$set = {};
    updateQuery.$push = {};

    if (typeof (projectId) !== common.variableTypes.STRING) {
        return callback(common.getError(7007), null);
    }

    if (typeof (teamId) !== common.variableTypes.STRING) {
        return callback(common.getError(7007), null);
    }

    if (typeof (ticketId) !== common.variableTypes.STRING) {
        return callback(common.getError(7007), null);
    }

    searchQuery.$and = [{ _id: ticketId }, { projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }];

    if (typeof (updateParams.title) === common.variableTypes.STRING
        && !common.isEmptyString(updateParams.title)) {
        updateQuery.$set.title = updateParams.title;
    }

    if (typeof (updateParams.description) === common.variableTypes.STRING
        && !common.isEmptyString(updateParams.description)) {
        updateQuery.$set.description = updateParams.description;
    }

    if (typeof (updateParams.assignee) === common.variableTypes.STRING) {
        updateQuery.$set.assignee = updateParams.assignee;
    }

    if (typeof (updateParams.milestone) === common.variableTypes.STRING) {
        updateQuery.$set.milestone = updateParams.milestone;
    }

    if (typeof (updateParams.points) === common.variableTypes.NUMBER) {
        updateQuery.$set.points = updateParams.points;
    }

    if (typeof (updateParams.stateHistoryEntry) === common.variableTypes.OBJECT) {
        updateQuery.$push.stateHistory = updateParams.stateHistoryEntry;
    }

    if (typeof (updateParams.assigneeHistoryEntry) === common.variableTypes.OBJECT) {
        updateQuery.$push.assigneeHistory = updateParams.assigneeHistoryEntry;
    }

    if (typeof (updateParams.inBacklog) === common.variableTypes.BOOLEAN) {
        updateQuery.$set.inBacklog = updateParams.inBacklog;
    }

    if (Array.isArray(updateParams.sprints)) {
        updateQuery.$set.sprints = updateParams.sprints;
    }

    if (Array.isArray(updateParams.releases)) {
        updateQuery.$set.releases = updateParams.releases;
    }

    if (Array.isArray(updateParams.tags)) {
        updateQuery.$set.tags = updateParams.tags;
    }

    if (Array.isArray(updateParams.links)) {
        updateQuery.$set.links = updateParams.links;
    }

    if (Array.isArray(updateParams.attachments)) {
        updateQuery.$set.attachments = updateParams.attachments;
    }

    if (Array.isArray(updateParams.milestoneTickets)) {
        updateQuery.$set.milestoneTickets = updateParams.milestoneTickets;
    }

    if (common.isValueInObjectWithKeys(updateParams.priority, 'value', common.ticketPriority)) {
        updateQuery.$set.priority = updateParams.priority;
    }

    if (common.isValueInObjectWithKeys(updateParams.status, 'value', common.ticketStatus)) {
        updateQuery.$set.status = updateParams.status;
    }

    if (common.isValueInObjectWithKeys(updateParams.state, 'value', common.ticketStates)) {
        updateQuery.$set.state = updateParams.state;
    }

    if (common.isValueInObjectWithKeys(updateParams.type, 'value', common.ticketTypes)) {
        updateQuery.$set.type = updateParams.type;
    }

    if (common.isEmptyObject(updateQuery.$push)) {
        delete updateQuery.$push;
    }

    if (common.isEmptyObject(updateQuery.$set)) {
        delete updateQuery.$set;
    }

    if (common.isEmptyObject(updateQuery)) {
        return callback(common.getError(7007), null);
    }

    updateQuery.$set.mtime = common.getDate();
    updateQuery.$set.imtime = common.getISODate();

    updateTicket(searchQuery, updateQuery, callback);
}

// <exports> -----------------------------------
exports.addMilestoneToTickets = addMilestoneToTickets;
exports.addTicket = addTicket;
exports.getMilestoneById = getMilestoneById;
exports.getTicketByDisplayId = getTicketByDisplayId;
exports.getTicketById = getTicketById;
exports.getTicketsByIds = getTicketsByIds;
exports.getTicketsBySprintId = getTicketsBySprintId;
exports.getTicketsByProjectId = getTicketsByProjectId;
exports.getTicketsByProjectIds = getTicketsByProjectIds;
exports.getTicketsByTeamId = getTicketsByTeamId;
exports.getTicketsInBacklog = getTicketsInBacklog;
exports.getTicketsWithNoSprints = getTicketsWithNoSprints;
exports.initialize = initialize;
exports.putTicketsInBacklog = putTicketsInBacklog;
exports.removeMilestoneFromTickets = removeMilestoneFromTickets;
exports.removeTicketFromMilestones = removeTicketFromMilestones;
exports.removeTicketsFromMilestones = removeTicketsFromMilestones;
exports.searchTicketsByProjectId = searchTicketsByProjectId;
exports.searchTicketsByTeamId = searchTicketsByTeamId;
exports.updateTicketById = updateTicketById;
// </exports> ----------------------------------