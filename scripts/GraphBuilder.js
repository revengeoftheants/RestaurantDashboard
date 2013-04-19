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
		   ,mSurveysJSONArray
		   ,mSurveysToDispl
		   ,mSurveysForReviewArray = new Array();



		/*
		Public Methods
		*/

		/* Loads the graph into the page.
		*
		*/
		Me.Load = function () {

			setDynamicStyles();

			// Load our data.
			loadData();
		};


		/*
		 * Updates the categories displayed on the graph.
		 */
		Me.UpdtGraphDisplCategories = function(inpEvent) {

			var clickedScoreBtn = jQuery(inpEvent.target);

			if (clickedScoreBtn.hasClass("active")) {
				// This button is being deactivated.
			} else {
				// This button is being activated.
			}	
		};


		/*
		 * Updates the graph's timescale and thus the surveys that are in scope. 
		 */
		Me.UpdtTimeScale = function(inpEvent) {

			var clickedTimeScale = jQuery(inpEvent.target);

			// Remove the "disabled" class from all the dropdown links to enable them.
			jQuery(".tmScaleItm").removeClass("disabled");

			// Disable the selected link.
			clickedTimeScale.parent().addClass("disabled");
		}


		/*
		Private Methods
		*/

		var setDynamicStyles = function() {
			var btn = jQuery(".scoreBtn");
			var hghtNbr = btn.height();

			btn.css("width", hghtNbr);
			btn.css("font-size", Math.round(hghtNbr * 0.8));
		};


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

					//updtSurveyLogDispl();
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

		    var category = svg.selectAll(".category")
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


      		// Update the buttons that display median scores.
      		updtBtnData(categories);

      		// Update the survey log.
      		updtSurveyLogDispl();

		};


		/*
		 * Updates the data displayed in the top buttons.
		 */
		var updtBtnData = function(inpSurveysByCategory) {

			var medianScoresByCategory = new Array();
			var categoryTyp;

			for (var catIdx = 0; catIdx < inpSurveysByCategory.length; catIdx++) {
				var categorySurveyScores = new Array();
				for (var surveyIdx = 0; surveyIdx < inpSurveysByCategory[catIdx].values.length; surveyIdx++) {
					categorySurveyScores.push(inpSurveysByCategory[catIdx].values[surveyIdx].score);
					categoryTyp = inpSurveysByCategory[catIdx].typ;
				}

				medianScoresByCategory[categoryTyp] = Math.round(d3.median(categorySurveyScores));
			}

			for (var categoryTyp in medianScoresByCategory) {
				var medianScoreNbr = medianScoresByCategory[categoryTyp];

				switch (parseInt(categoryTyp)) {
					case OVERALL_SATISFACTION_NBR:
						jQuery("#overallSatisfactionBtn").text(medianScoreNbr);
						break;
					case FOOD_SATISFACTION_NBR:
						jQuery("#foodSatisfactionBtn").text(medianScoreNbr);
						break;
					case SERVICE_SATISFACTION_NBR:
						jQuery("#serviceSatisfactionBtn").text(medianScoreNbr);
						break;
					case CLEANLINESS_NBR:
						jQuery("#cleanlinessBtn").text(medianScoreNbr);
						break;
					case RECOMMENDATION_NBR:
						jQuery("#recommendationSatisfactionBtn").text(medianScoreNbr);
				}
			}
		};


		/*
		 * Updates the survey log.
		 */
		var updtSurveyLogDispl = function() {
			
			// Add the surveys that have already been displayed but still require review.
			mSurveysToDispl = mSurveysForReviewArray.filter(reviewRequiredForSurvey);

			// Add any new surveys retrieved from the server that also require review.
			var jsonSurveysToCreateObjsFor = mSurveysJSONArray.filter(reviewRequiredForSurvey);

			var newSurveyObjsForReview = new Array();

			for (var idx = 0; idx < jsonSurveysToCreateObjsFor.length; idx++) {
				newSurveyObjsForReview.push(crteSurveyObjForReview(jsonSurveysToCreateObjsFor[idx]));
			}

			mSurveysToDispl = mSurveysToDispl.concat(newSurveyObjsForReview);

			// Finally add any in-scope surveys that do not already exist in the to-display list.
			jsonSurveysToCreateObjsFor.length = 0;

			var newSurveyId;

			for (var idx = 0; idx < mSurveysJSONArray.length; idx++) {
				newSurveyId = mSurveysJSONArray[idx][0];

				// If we haven't already added this survey as a "must review" survey, then
				// we can add it as a normal survey.
				if (newSurveyObjsForReview.some(existsAsMustReviewSurvey, newSurveyId) == false) {
					mSurveysToDispl.push(crteSurveyObj(mSurveysJSONArray[idx]));
				}
			}


			// Delete all existing rows from our table.
			jQuery("#surveyTbl > tbody > tr").remove();

			var surveyTblTBody = jQuery("#surveyTbl > tbody");

			for (var idx = 0; idx < mSurveysToDispl.length; idx++) {
				var currSurvey = mSurveysToDispl[idx];
				var tblRowHtmlTxt;

				// If this survey needs to be reviewed, mark it with Bootstrap's error class.
				if (currSurvey.MatchesReviewRulesInd == true && currSurvey.ReviewedInd == false) {
					tblRowHtmlTxt = '<tr class="error">';
				} else {
					tblRowHtmlTxt = "<tr>";
				}

				tblRowHtmlTxt += "<td>" + currSurvey.Id + "</td><td>stuff</td></tr>";
				surveyTblTBody.append(tblRowHtmlTxt);
			}
		};


		/*
		 * Array.filter() callback function which returns true if a survey
		 * meets any of the rules for warranting review.
	  	 *
		 * N.B.: This method can handle both Survey class objects as well as the raw
		 * JSON retrieved from the server, for which inpArrayElem would be an array of a
		 * single survey's values.
		 */
		var reviewRequiredForSurvey = function(inpArrayElem, inpIdxNbr, inpArray) {
		 	var rtnInd = false;

		 	// Perform the first group of rules if we're dealing with a Survey object.
		 	if (typeof(inpArrayElem) == "Survey") {
		 		if (inpArrayElem.MatchesReviewRulesInd == true && inpArrayElem.ReviewedInd == false) {
		 			rtnInd = true;
		 		} else if (inpArrayElem.OverallSatisfactionNbr < 5) {
		 			rtnInd = true;
		 		} else if (inpArrayElem.FoodSatisfactionNbr < 5) {
		 			rtnInd = true;
		 		} else if (inpArrayElem.ServiceSatisfactionNbr < 5) {
		 			rtnInd = true;
		 		} else if (inpArrayElem.CleanlinessNbr < 5) {
		 			rtnInd = true;
		 		} else if (inpArrayElem.RecommendationNbr < 5) {
		 			rtnInd = true;
		 		}
		 	} else {
		 		if (inpArrayElem[OVERALL_SATISFACTION_NBR]< 5) {
		 			rtnInd = true;
		 		} else if (inpArrayElem[FOOD_SATISFACTION_NBR] < 5) {
		 			rtnInd = true;
		 		} else if (inpArrayElem[SERVICE_SATISFACTION_NBR] < 5) {
		 			rtnInd = true;
		 		} else if (inpArrayElem[CLEANLINESS_NBR] < 5) {
		 			rtnInd = true;
		 		} else if (inpArrayElem[RECOMMENDATION_NBR] < 5) {
		 			rtnInd = true;
		 		}
		 	}

		 	return rtnInd;
		};


		/*
		 * Instantiates a Survey class object out of a JSON element and marks it for review.
		 */
		var crteSurveyObjForReview = function(inpJSONSurveyObj) {
			var rtnSurvey = crteSurveyObj(inpJSONSurveyObj);

		 	rtnSurvey.MatchesReviewRulesInd = true;
		 	rtnSurvey.ReviewedInd = false;

		 	return rtnSurvey;
		}


		/*
		 * Builds a Survey class object using a JSON representation of that survey.
		 */
		var crteSurveyObj = function(inpJSONSurveyObj) {
		 	var rtnSurvey = new Survey();

		 	rtnSurvey.Id = inpJSONSurveyObj[0];
			rtnSurvey.SubmittedTs = inpJSONSurveyObj[1];
			rtnSurvey.TransactionTs = inpJSONSurveyObj[2];
			rtnSurvey.CustIdNbr = inpJSONSurveyObj[3];
			rtnSurvey.CustAgeNbr = inpJSONSurveyObj[4];
			rtnSurvey.CustGenderTxt = inpJSONSurveyObj[5];
			rtnSurvey.CustAddrTxt = inpJSONSurveyObj[6];
			rtnSurvey.OverallSatisfactionNbr = inpJSONSurveyObj[7];
			rtnSurvey.FoodSatisfactionNbr = inpJSONSurveyObj[8];
			rtnSurvey.ServiceSatisfactionNbr = inpJSONSurveyObj[9];
			rtnSurvey.CleanlinessNbr = inpJSONSurveyObj[10];
			rtnSurvey.RecommendationNbr = inpJSONSurveyObj[11];
			rtnSurvey.CommentsTxt = inpJSONSurveyObj[12];
			rtnSurvey.PurchasedItmsTxt = inpJSONSurveyObj[13];

			rtnSurvey.MatchesReviewRulesInd = false;
		 	rtnSurvey.ReviewedInd = false;

			return rtnSurvey;
		};


		/*
		 * Array.some() callback function which returns true if a survey ID (in scope
		 * here as the "this" object) matches that of the current element in the array.
		 */
		var existsAsMustReviewSurvey = function(inpArrayElem, inpIdxNbr, inpArray) {
			var rtnInd = false;

			if (this == inpArrayElem.Id) {
				rtnInd = true;
			}

			return rtnInd;
		};
	};
}	