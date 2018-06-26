import _ from 'underscore';
import Backbone from 'backbone';
import Bookmark from './Bookmark';

const BATCH_SIZE = 30;

export default Backbone.Collection.extend({
	model: Bookmark,
	url: 'bookmark',
	parse: function(json) {
		return json.data;
	},
	initialize: function() {
		this.loadingState = new Backbone.Model({
			page: 0,
			query: {},
			fetching: false,
			reachedEnd: false
		})
	},
	setFetchQuery: function(data) {
		this.loadingState.set({
			page: 0,
			query: data,
			fetching: false,
			reachedEnd: false
		})
	},
	fetchPage: function() {
	    var that = this;
		if (this.loadingState.get('fetching') || this.loadingState.get('reachedEnd')) {
			return;
		}
		const nextPage = this.loadingState.get('page');
		this.loadingState.set({page: nextPage+1, fetching: true});

		// Show spinner after 1.5s if we're fetching a new query
		const spinnerTimeout = setTimeout(() => nextPage === 0 && this.reset(), 1500);

		return this.fetch({
			data: _.extend({}, this.loadingState.get('query'), {page: nextPage, limit: BATCH_SIZE}),
			reset: nextPage === 0,
			remove: false,
			success: function(collections, response) {
				clearTimeout(spinnerTimeout);
				that.loadingState.set({
					fetching: false,
					reachedEnd: response.data.length < BATCH_SIZE
				});
				if (nextPage <= 1) {
					that.fetchPage()
				}
			}
		});
	}
});
