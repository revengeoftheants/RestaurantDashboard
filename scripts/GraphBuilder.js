if (GraphBuilder) {
	// This singleton object already exists.
} else {
	var GraphBuilder = new function () {
		"use strict";

		// Constants

		// JSON column indices
		var SURVEY_ID = 0
		   ,TRANSACTION_TS = 2
		   ,OVERALL_SATISFACTION_NBR = 7
		   ,FOOD_SATISFACTION_NBR = 8
		   ,SERVICE_SATISFACTION_NBR = 9
		   ,CLEANLINESS_NBR = 10
		   ,RECOMMENDATION_NBR = 11
			// Timeframe types
		   ,DAY = 1
		   ,WEEK = 2
		   ,MONTH = 3
		   ,YEAR = 4
		   // Other 
		   ,CATEGORY_TYPS = {7:"Overall", 8:"Food", 9:"Service", 10:"Clean", 11:"Rec"}
		   ,SPACE_2 = "&nbsp;&nbsp;"
		   ,HOUR_TICK_LBLS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]
		   ,ORIG_CIRCLE_RAD_NBR = 3
		   ,BIG_CIRCLE_RAD_NBR = 5;


		// Variables
		var Me = this
		   ,mSurveysJSONArray
		   ,mSurveysToDispl
		   ,mSurveysForReviewArray = []
		   ,parseDate = d3.time.format("%m/%d/%Y %H:%M:%S").parse
		   ,mXScale
		   ,mYLScale;



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
		 * Displays or hides a given category in the graph.
		 */
		Me.ToggleTimeseriesCategory = function(inpEvent) {
			var clickedScoreBtn = jQuery(inpEvent.target);
			var categoryId = clickedScoreBtn.data("categoryId");

		    var timeseriesLn = d3.select("#chartLn" + CATEGORY_TYPS[categoryId]);

		    // Toggle the timeseries line on or off. 
		    if (timeseriesLn.empty()) {
	            drawTimeseriesCategory(categoryId);
	            clickedScoreBtn.addClass("active");
		    } else { 
		        timeseriesLn.remove();
		        // This makes sure we also clean up any tooltip text, which exists independently of the timeseriesLn object.
		        jQuery("text." + CATEGORY_TYPS[categoryId]).remove();
		        clickedScoreBtn.removeClass("active");
		    }
		};


		/*
		 * Opens the requested survey.
		 */
		Me.ToggleSurveyDispl = function(inpEvent, inpSurveyId, inpSelectingInd) {

			var slctedSurveyRow
			   ,surveyId
			   ,selectingInd;

			if (inpEvent) {
				slctedSurveyRow = jQuery(inpEvent.target).parent();
				surveyId = slctedSurveyRow.data("surveyid");
				selectingInd = true;
			} else {
				surveyId = inpSurveyId;
				slctedSurveyRow = jQuery('tr[data-surveyid="' + surveyId + '"]');
				selectingInd = inpSelectingInd;
			}

			var idx = 0;
			var surveyObj = null;

			// Retrieve this survey.
			while (idx < mSurveysToDispl.length && surveyObj == null) {
				surveyObj = mSurveysToDispl[idx];

				if (surveyObj.Id == surveyId) {
					// We have the correct object.
				} else {
					surveyObj = null;
					idx++;
				}
			}

			if (slctedSurveyRow.hasClass("selected") && selectingInd == false) {
				// The user wants to close this survey.
				slctedSurveyRow.removeClass("selected");
				
				jQuery("#msgDisplCntnr").css("visibility", "hidden");

			} else if (slctedSurveyRow.hasClass("selected") && selectingInd == true) {
				// The user is selecting the same survey again, so we don't have to do anything.
			} else {
				// This survey is being selected. Removed the "selected" class from all other rows and 
				slctedSurveyRow.parent().children().removeClass("selected");

				// Highlight the selected survey and display its information.
				slctedSurveyRow.addClass("selected");

				var ts = new moment(surveyObj.TransactionTs);
				var tsTxt = ts.format("YYYY-MM-DD HH:mm");
				var purchasedItms = surveyObj.PurchasedItmsTxt.split(" | ");
				var purchasedItmsTxt = "";

				for (var idx = 0; idx < purchasedItms.length; idx++) {
					if (idx < purchasedItms.length - 2) {
						purchasedItmsTxt += purchasedItms[idx] + ", ";
					} else if (idx == purchasedItms.length - 2) {
						purchasedItmsTxt += purchasedItms[idx] + ", and ";
					} else {
						purchasedItmsTxt += purchasedItms[idx];
					}
				}

				jQuery("#survCust td:last-child").text(surveyObj.CustGenderTxt);
				jQuery("#survDate td:last-child").text(tsTxt);
				jQuery("#survItms td:last-child").text(purchasedItmsTxt);
				jQuery("#survComm td:last-child").text(surveyObj.CommentsTxt);

				jQuery("#scrOverall td:last-child").text(surveyObj.OverallSatisfactionNbr);
				jQuery("#scrFood td:last-child").text(surveyObj.FoodSatisfactionNbr);
				jQuery("#scrServ td:last-child").text(surveyObj.ServiceSatisfactionNbr);
				jQuery("#scrClean td:last-child").text(surveyObj.CleanlinessNbr);
				jQuery("#scrRec td:last-child").text(surveyObj.RecommendationNbr);

				jQuery("#msgDisplCntnr").css("visibility", "visible");
			}	
		}



		/*
		Private Methods
		*/

		var setDynamicStyles = function() {
			var btns = jQuery(".scoreBtn");
			var hghtNbr = btns.height();

			btns.css("width", hghtNbr);
			btns.css("font-size", Math.round(hghtNbr * 0.8));

			jQuery("#overallSatisfactionBtn").data("categoryId", OVERALL_SATISFACTION_NBR);
			jQuery("#foodSatisfactionBtn").data("categoryId", FOOD_SATISFACTION_NBR);
			jQuery("#serviceSatisfactionBtn").data("categoryId", SERVICE_SATISFACTION_NBR);
			jQuery("#cleanlinessBtn").data("categoryId", CLEANLINESS_NBR);
			jQuery("#recommendationBtn").data("categoryId", RECOMMENDATION_NBR);
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

					bldGraph(DAY);
				},
				error: function(inpError) { 
					console.log(inpError.message);
				}
			} );
		};


		/*
		* Builds the page's graph element.
		*/
		var bldGraph = function (inpTimeDomain) {

			//Create an svg element for this graph.
			var svgIdTxt = "svgGraph";
			var graphCntnrHgtNbr = jQuery("#graphCntnr").height();
			var graphCntnrWdthNbr = jQuery("#graphCntnr").width();

			// set up the viewport, the scales, and axis generators 
		    var container_dimensions = { 
		        	width: jQuery("#graphCntnr").width(), 
		        	height: jQuery("#graphCntnr").height()
		    	}
		    ,margins = { 
		        top: 20, 
		        right: 20, 
		        bottom: 40, 
		        left: 40 
		    }
		    ,chart_dimensions = { 
		        width: container_dimensions.width - margins.left - margins.right, 
		        height: container_dimensions.height - margins.top - margins.bottom 
		    }; 


    		// Calculate our x-axis scale based upon the chosen time scale.
			var tickIntervalTyp, tmIntervalTyp, timeFormat, xAxisLblTxt;
			switch (inpTimeDomain) {
				case WEEK:
					tmIntervalTyp = d3.time.day;
					tickIntervalTyp = d3.time.days;
					timeFormat = d3.time.format("%a");
					xAxisLblTxt = "Day";
					break;
				case MONTH:
					tmIntervalTyp = d3.time.week;
					tickIntervalTyp = d3.time.weeks;
					timeFormat = d3.time.format("%m/%d/%Y");
					xAxisLblTxt = "Week";
					break;
				case YEAR:
					tmIntervalTyp = d3.time.year;
					tickIntervalTyp = d3.time.months;
					timeFormat = d3.time.format("%m");
					xAxisLblTxt = "Month";
					break;
				default:
					tmIntervalTyp = d3.time.hour;
					tickIntervalTyp = d3.time.hours;
					timeFormat = d3.time.format("%H");
					xAxisLblTxt = "Hour";
					break;
			}

			var transTsArray = [];

			for (var idx = 0; idx < mSurveysJSONArray.length; idx++) {
				transTsArray.push(parseDate(mSurveysJSONArray[idx][TRANSACTION_TS]));
			}

			var minDate = d3.min(transTsArray);
			var maxDate = d3.max(transTsArray);

    		mXScale = d3.time.scale()			
						.domain([minDate, maxDate])
						.range([0, chart_dimensions.width])
						.nice(tmIntervalTyp);

			mYLScale = d3.scale.linear()
						 .domain([0, 10])
						 .range([chart_dimensions.height, 0]);

			var yRScale = d3.scale.linear()
							.domain([0, 100])
							.range([chart_dimensions.height, 0]);

			var xAxis = d3.svg.axis()
    					  .scale(mXScale)
    					  .orient("bottom")
    					  .tickSize(3, 3, 0)
    					  .ticks(tickIntervalTyp, 1)
    					  .tickFormat(timeFormat);

			var yLAxis = d3.svg.axis()
    					   .scale(mYLScale)
    					   .orient("left")
    					   .tickSize(3, 3, 0);

			var yRAxis = d3.svg.axis()
    					   .scale(yRScale)
    					   .orient("right");

			var svg = d3.select("#graphCntnr").append("svg")
											  .attr("id", svgIdTxt)
											  .attr("width", container_dimensions.width) 
        									  .attr("height", container_dimensions.height) 
       										  .append("g") 
        									  .attr("transform", "translate(" + margins.left + "," + margins.top + ")") 
        									  .attr("id", "chart");

    		svg.append("g")
    		   .attr("class", "axis")
    		   //Move the axis to the bottom and to the right.
    		   .attr("transform", "translate(0," + chart_dimensions.height + ")")
    		   .call(xAxis)
    		   .append("text")
    		   .attr("transform", "translate(0," + -chart_dimensions.height + ")")
    		   // Translate back to original position for ease of next translation.
    		   .attr("x", chart_dimensions.width / 2)
    		   .attr("y", chart_dimensions.height + (margins.bottom * .9))
    		   .style("text-anchor", "middle")
    		   .text(xAxisLblTxt);

			svg.append("g")
      		   .attr("class", "axis")
      		   .call(yLAxis)
    		   .append("text")
    		   .attr("transform", "translate(" + -(margins.left * .7) + "," + chart_dimensions.height/2 + ") " + "rotate(-90)")
      		   .style("text-anchor", "middle")
      		   .text("Score");

      		// Update the buttons that display median scores.
      		updtBtnData(mSurveysJSONArray);

      		// Update the survey log.
      		updtSurveyLogDispl();

		};


		/*
		 * Updates the data displayed in the top buttons.
		 */
		var updtBtnData = function(inpSurveys) {

			var categorySurveyScores = []
			   ,currSurvey
			   ,categoryNbr
			   ,categoryTypTxt;

			for (var surveyIdx = 0; surveyIdx < inpSurveys.length; surveyIdx++) {
				currSurvey = inpSurveys[surveyIdx];
				for (categoryNbr in CATEGORY_TYPS) {
					categoryTypTxt = categoryNbr.toString();

					if (categorySurveyScores[categoryTypTxt]) {
						// This category's inner array already exists.
					} else {
						categorySurveyScores[categoryTypTxt] = [];
					}

					categorySurveyScores[categoryTypTxt].push(currSurvey[categoryNbr]);
				}
			}

			for (categoryTypTxt in categorySurveyScores) {
				var medianScoreNbr = Math.round(d3.median(categorySurveyScores[categoryTypTxt]));

				switch (parseInt(categoryTypTxt)) {
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
						jQuery("#recommendationBtn").text(medianScoreNbr);
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

			var newSurveyObjsForReview = [];

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
				var tblRowHtmlTxt = '<tr data-surveyid=' + currSurvey.Id + ' onClick="GraphBuilder.ToggleSurveyDispl(event)"';

				// If this survey needs to be reviewed, mark it with Bootstrap's error class.
				if (currSurvey.MatchesReviewRulesInd == true && currSurvey.ReviewedInd == false) {
					tblRowHtmlTxt += 'class="error"';
				}

				var ts = new moment(currSurvey.TransactionTs);
				var tsTxt = ts.format("YYYY-MM-DD HH:mm");

				var scoresTxt = currSurvey.OverallSatisfactionNbr + SPACE_2 + currSurvey.FoodSatisfactionNbr + SPACE_2 +
								currSurvey.ServiceSatisfactionNbr + SPACE_2 + currSurvey.CleanlinessNbr + SPACE_2 +
								currSurvey.RecommendationNbr;

				var commentTxt = currSurvey.CommentsTxt.substr(0, 29);

				if (commentTxt == "N/A") {
					commentTxt = "";
				}

				tblRowHtmlTxt += "><td>" + tsTxt + "</td><td>" + scoresTxt +"</td><td>" + commentTxt +"</td></tr>";
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


		/*
		 * Draws a given timeseries category.
		 */
		var drawTimeseriesCategory = function(inpCategoryId) { 
  
		    var categoryVals = [];

	    	// Gather the value of this category from each of the surveys.
	    	for (var surveysIdx = 0; surveysIdx < mSurveysJSONArray.length; surveysIdx++) {
	    		categoryVals.push( {
	    							transTs: mSurveysJSONArray[surveysIdx][TRANSACTION_TS],
	    							score: mSurveysJSONArray[surveysIdx][inpCategoryId],
	    							categoryTxt: CATEGORY_TYPS[inpCategoryId],
	    							surveyId: mSurveysJSONArray[surveysIdx][SURVEY_ID]
	    						   }
	    						 );
	    	}

	    	// clean up the dates 
		    categoryVals.forEach(function(inpDatum) { 
		        inpDatum.transTs = parseDate(inpDatum.transTs); 
		    }); 
		  
		    var line = d3.svg.line() 
		        .x(function(inpEntry) { return mXScale(inpEntry.transTs); }) 
		        .y(function(inpEntry) { return mYLScale(inpEntry.score); }) 
		       .interpolate("linear"); 
		  
		    var g = d3.select("#chart") 
		        .append("g") 
		        .attr("id", "chartLn" + CATEGORY_TYPS[inpCategoryId]) 
		        .attr("class", "timeseries " + CATEGORY_TYPS[inpCategoryId]); 
		  
		  	// Add the line's path and its description.
		    g.append('path') 
		        .attr('d', line(categoryVals)); 
		  
		  	// Add a circle at the intersection of each survey's submission timestamp and score for this category.
		    g.selectAll("circle") 
		        .data(categoryVals) 
		        .enter() 
		        .append("circle") 
		        .attr("cx", function(inpEntry) { 
		        	return mXScale(inpEntry.transTs); 
		    	}) 
		        .attr("cy", function(inpEntry) { 
		        	return mYLScale(inpEntry.score); 
		   		 }) 
		        .attr("r", ORIG_CIRCLE_RAD_NBR) // Sets the radius of the circle.
		        .attr("data-surveyid", function(inpEntry) {
		        	return inpEntry.surveyId;
		        })
		  		.attr("data-categorytxt", function(inpEntry) {
		  			return inpEntry.categoryTxt;
		  		})
		  		.attr("data-slctdind", "N");

		  	/* Adds a delay to the drawing of each survey data point. Drawing it from a radius of 0 to 5.
		    var enter_duration = 1000; 
		  
		    g.selectAll('circle')
		     .transition() 
		     .delay(function(d, i) { 
		    	return i / data.length * enter_duration; 
		     })
		     .attr('r', 5) // Defines the final radius size of each circle.
		     .each('end', function(d, i) { 
		    	if (i === data.length - 1) { 
		            add_label(this, d); 
		        } 
		    });
		    */
		  
			// When the user mouses over a circle, grow it. When he mouses out, shrink it back down to original size.
		    g.selectAll("circle") 
		     .on("mouseover", function() { 
		     		d3.select(this)
		     		  .transition()
		     		  .attr("r", BIG_CIRCLE_RAD_NBR); 
		     }) 
		     .on("mouseout", function(inpCircle, inpIdxOfCircle) {
		     		if (d3.select(this).attr("data-slctdind") == "N") {
		     			// If this circle is not currently selected, we can shrink this circle back down.
		     			d3.select(this).transition().attr("r", ORIG_CIRCLE_RAD_NBR);
		     		}
		    })
		     // When a user mouses over a circle, add a tooltip that displays the category score for this survey.
		     .on("mouseover.tooltip", function(inpCircle) { 
			     	//d3.select("text." + inpCircle.categoryTxt).remove(); 
			        d3.select("#chart") 
			            .append("text") 
			            .text(inpCircle.score) 
			            .attr("x", mXScale(inpCircle.transTs)) 
			            .attr("y", mYLScale(inpCircle.score) - 10) 
			            .attr("class", inpCircle.categoryTxt)
			            .attr("data-surveyid", inpCircle.surveyId)
			            .attr("data-categorytxt", inpCircle.categoryTxt)
			            .attr("data-slctdind", "N");
		     }) 
		     .on("mouseout.tooltip", function(inpCircle) {
		     		if (d3.selectAll('text[data-surveyid="' + inpCircle.surveyId + '"]').filter('text[data-categorytxt="' + inpCircle.categoryTxt + '"]').attr("data-slctdind") == "N") {

		     			var tooltipForSurveyAndCategory = d3.selectAll('text[data-surveyid="' + inpCircle.surveyId + '"]').filter('text[data-categorytxt="' + inpCircle.categoryTxt + '"]');

     					tooltipForSurveyAndCategory.transition()
     							  				   .duration(200) 
    			  				  				   .style('opacity', 0)
     			  				  				   .remove();
		     		}
		     })
		     // When a user clicks on a circle, open its corresponding survey in the display area.
		     .on("click", function(inpCircle) {
		     		var selectingInd;

		     		if (d3.selectAll('circle[data-surveyid="' + inpCircle.surveyId + '"]').filter('circle[data-categorytxt="' + inpCircle.categoryTxt + '"]').attr("data-slctdind") == "Y") {
		     			// The user is de-selecting this survey.
		     			selectingInd = false;

		     			d3.selectAll('text[data-surveyid="' + inpCircle.surveyId + '"]').filter('text[data-categorytxt="' + inpCircle.categoryTxt + '"]').attr("data-slctdind", "N");
		     			d3.selectAll('circle[data-surveyid="' + inpCircle.surveyId + '"]').filter('circle[data-categorytxt="' + inpCircle.categoryTxt + '"]').attr("data-slctdind", "N");
		     		} else {
		     			// The user is selecting this survey.
		     			selectingInd = true;

		     			// First "de-select" all circles and tooltips, and then "re-select" the ones we want to keep.
		     			d3.selectAll("text[data-surveyid]").attr("data-slctdind", "N");
		     			d3.selectAll("circle").attr("data-slctdind", "N");

		     			d3.selectAll('text[data-surveyid="' + inpCircle.surveyId + '"]').filter('text[data-categorytxt="' + inpCircle.categoryTxt + '"]').attr("data-slctdind", "Y");
		     			d3.selectAll('circle[data-surveyid="' + inpCircle.surveyId + '"]').filter('circle[data-categorytxt="' + inpCircle.categoryTxt + '"]').attr("data-slctdind", "Y");
		     		}

		     		d3.selectAll('text[data-slctdind="N"]')
		     			  .transition()
     					  .duration(200) 
    			  		  .style('opacity', 0)
     			  		  .remove();

     			  	d3.selectAll('circle[data-slctdind="N"]').transition().attr("r", ORIG_CIRCLE_RAD_NBR);

		     		// Open or close the survey in the display area.
		     		GraphBuilder.ToggleSurveyDispl(null, inpCircle.surveyId, selectingInd);
		     });
		};
	};
}	