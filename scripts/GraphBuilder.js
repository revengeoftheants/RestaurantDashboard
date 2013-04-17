if (GraphBuilder) {
	// This singleton object already exists.
} else {
	var GraphBuilder = new function () {
		"use strict";

		// Constants

		// JSON column indices
		var TRANSACTION_TS = 2
		   ,OVERALL_SATISFACTION_NBR = 7
		   ,FOOD_SATISFACTION_NBR = 8
		   ,SERVICE_SATISFACTION_NBR = 9
		   ,CLEANLINESS_NBR = 10
		   ,RECOMMENDATION_NBR = 11

		// Timeframe types
		var DAY = 1
		   ,WEEK = 2
		   ,MONTH = 3
		   ,YEAR = 4;

		var CATEGORY_TYPS = new Array(OVERALL_SATISFACTION_NBR, FOOD_SATISFACTION_NBR,
									  SERVICE_SATISFACTION_NBR, CLEANLINESS_NBR, RECOMMENDATION_NBR)
		   ,HOUR_TICK_LBLS = new Array(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23);


		// Variables
		var Me = this
		   ,mSurveysJSONArray;



		/*
		Public Methods
		*/

		/* Loads the graph into the page.
		*
		*/
		Me.Load = function () {

			//Load our data.
			loadData();
		};


		/*
		Private Methods
		*/

		/*
		* Retrieves and parses the JSON data, loading them into objects.
		*/
		var loadData = function () {

			// Perform an AJAX call to retrieve the JSON object and perform this
			// callback function.
			// N.B.: When running this in localhost, you will get a "same origin" error unless you do
			// a JSONP request. This entails creating a jsonpCallback function and putting your JSON data
			// inside that function (i.e., the data in your .json file has to be wrapped by that function).
			$.ajax( {
				type: "GET",
				url: "http://localhost:8000/data/Surveys.json",
				dataType: "jsonp",
				jsonpCallback: "jsonCallback",
				contentType: "application/json",
				success: function(inpSurveysJSONDatObj) {
					mSurveysJSONArray = inpSurveysJSONDatObj.data;

					bldGraph(DAY, new Date("2013-04-16 00:00:00"));

					updtBtnData();
				},
				error: function(inpError) { 
					console.log(inpError.message);
				}
			} );
		};


		/*
		* Builds the page's graph element.
		*/
		var bldGraph = function (inpTimeDomain, inpStartDate) {

			//Create an svg element for this graph.
			var svgIdTxt = "svgGraph";
			var graphCntnrHgtNbr = jQuery("#graphCntnr").height();
			var graphCntnrWdthNbr = jQuery("#graphCntnr").width();

			var margin = 20;

			var svg = d3.select("#graphCntnr").append("svg")
						.attr("id", svgIdTxt);


    		// Construct an ordinal scale with 10 categorical colors, and assign our score categories to these color
    		// colors.
    		var colorScale = d3.scale.category10();
    		colorScale.domain(CATEGORY_TYPS);

    		// Using the current domain array, call its map() function to create a new array with the result of
    		// the function call for each element in the original array. 
    		var categories = colorScale.domain().map(function(inpCategoryTyp) {
    			return {
    				typ: inpCategoryTyp,
    				// Store off values from each survey in our original JSON.
    				values: mSurveysJSONArray.map(function(inpSurvey) {
    					return {date: new Date(inpSurvey[TRANSACTION_TS]), score: inpSurvey[inpCategoryTyp]};
    				})
    			};
    		});


    		// Calculate our x-axis scale based upon the chose time scale.
			var endDate = moment(inpStartDate);
			var domainStartNbr, domainEndNbr, tickIntervalTyp, timeFormat, xAxisLblTxt;
			switch (inpTimeDomain) {
				case WEEK:
					endDate = endDate.add("weeks", 1);
					tickIntervalTyp = d3.time.days;
					timeFormat = d3.time.format("%a");
					xAxisLblTxt = "Day";
					break;
				case MONTH:
					endDate = endDate.add("months", 1);
					tickIntervalTyp = d3.time.weeks;
					timeFormat = d3.time.format("%m/%d/%Y");
					xAxisLblTxt = "Week";
					break;
				case YEAR:
					endDate = endDate.add("years", 1);
					tickIntervalTyp = d3.time.months;
					timeFormat = d3.time.format("%m");
					xAxisLblTxt = "Month";
					break;
				default:
					endDate = endDate.add("days", 1);
					domainStartNbr = 0;
					domainEndNbr = 24;
					tickIntervalTyp = d3.time.hours;
					timeFormat = d3.time.format("%H");
					xAxisLblTxt = "Hour";
					break;
			}

			var paddingPxlNbr = 30;


    		var xScale = d3.time.scale()			
						   .domain([domainStartNbr, domainEndNbr])
						   .range([paddingPxlNbr, graphCntnrWdthNbr - (paddingPxlNbr * 2)]);

			var yLScale = d3.scale.ordinal()
						    .domain([0, 10])
						    .range([graphCntnrHgtNbr - paddingPxlNbr, paddingPxlNbr]);

			var yRScale = d3.scale.linear()
							.domain([0, 100])
							.range([graphCntnrHgtNbr - paddingPxlNbr, paddingPxlNbr]);

			var xAxis = d3.svg.axis()
    					  .scale(xScale)
    					  .orient("bottom")
    					  .tickSize(3, 3, 0)
    					  .ticks(tickIntervalTyp, 1)
    					  .tickFormat(timeFormat);

			var yLAxis = d3.svg.axis()
    					   .scale(yLScale)
    					   .orient("left")
    					   .tickSize(3, 3, 0);

			var yRAxis = d3.svg.axis()
    					   .scale(yRScale)
    					   .orient("right");

    		var line = d3.svg.line()
    					 .interpolate("basis")
    					 .x(function(inpCategorySurveyVal) {
    					 	return xScale(inpCategorySurveyVal.date.getHours()); 
    					 })
    					 .y(function(inpCategorySurveyVal) {
    					 	return yLScale(inpCategorySurveyVal.score);
    					 });

    		var yTranslationNbr = graphCntnrHgtNbr - paddingPxlNbr;

    		svg.append("g")
    		   .attr("class", "axis")
    		   <!--Move the axis to the bottom and to the right.-->
    		   .attr("transform", "translate(0," + yTranslationNbr + ")")
    		   .call(xAxis)
    		   .append("text")
    		   .attr("x", ((graphCntnrWdthNbr - paddingPxlNbr) / 2))
    		   .attr("y", paddingPxlNbr/1.1)
    		   .style("text-anchor", "middle")
    		   .text(xAxisLblTxt);

			svg.append("g")
      		   .attr("class", "axis")
      		   .attr("transform", "translate(" + paddingPxlNbr + ",0)")
      		   .call(yLAxis)
    		   .append("text")
    		   .attr("transform", "translate(" + -paddingPxlNbr/2 + "," + yTranslationNbr/2 + ") " + "rotate(-90)")
    		   .attr("x", 0)
    		   .attr("y", 0)
      		   .style("text-anchor", "middle")
      		   .text("Score");

		    var category = svg.selectAll("circle")
      						  .data(categories)
    						  .enter()
    						  .append("g")
    						  .attr("class", "category");
    						  /*
    						  .attr("cx", function(inpCategory) {
    						  		return inpCategory[0];
    						  })
    						  .attr("cy", function(inpCategory) {
    						  		return	inpCategory[1];
    						  })
    						  .attr("r", 3)
      						  .attr("class", "category");
      						  */

      		category.append("path")
      				.attr("class", "line")
      				.attr("d", function(inpCategory) {
      					return line(inpCategory.values);
      				})
      				.style("stroke", function(inpCategory) {
      					return colorScale(inpCategory.typ);
      				});

		};


		/*
		 * Updates the data displayed in the top bottoms.
		 */
		var updtBtnData = function() {
			jQuery("#overallSatisfactionBtn").text("7");
			jQuery("#recommendationSatisfactionBtn").text("10");
			jQuery("#foodSatisfactionBtn").text("8");
			jQuery("#serviceSatisfactionBtn").text("7");
			jQuery("#cleanlinessBtn").text("7");
		}
	};
}	