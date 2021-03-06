var treeData;
$(document).ready( function(){

    // used to ensure the container which holds all of the sliding elements is the correct width
    // prevents the last slide from being crammed to the right, disrupting the elements if you go back from a final node
    slideDifferential = 30;
	windowWidth = $('#tree-window').outerWidth( false ) - slideDifferential; //adjusted to work with Bootstrap CSS
	sliderWidth = 0;
	slideTime = 300;
	branches = new Array();
	options = {};
	var thisURL = new String(document.location);
	var urlParts = thisURL.split('?');
	loadData( urlParts[1] );
	
	$('#tree-reset').click( function(e){
	  console.log("RESET");
	  $('#tree-window').scrollTo( 0 + 'px', { axis:'x', 
	                                          duration: slideTime, 
	                                          easing:'easeInOutExpo',
	                                          onAfter: function(){
	                                            $('.tree-content-box:gt(0)').remove();
	                                          } //onAfter
                                          } // options
                              ); //scrollTo
  }); //click
		
});

function debug( str ){
	$('#debug').append( str + '<br />' );
}

function loadData( id ){
	$.ajax({
		type: "GET", 
		url: "xml/tree" + id + ".xml", 
		dataType: "xml", 
		success: function( xml ){
			buildNodes( xml );
		},
        error: function(){
//            alert('Specified decision tree not found!');
            $('#reload-indicator').removeClass('hidden');
        }
	});
}

function TreeBranch(){
	this.id = '';
	this.content = '';
	this.forkIDs = new Array();
	this.forkLabels = new Array();
}

function parseOptions( xmlData ){
  
}

function buildNodes( xmlData ){
	var maxDepth = 0;
	treeData = xmlData;
	$(xmlData).find('branch').each(
		function(){
			var branch = new TreeBranch();
			branch.id = $(this).attr('id');
			branch.content = $(this).find('content').text();
			$(this).find('fork').each(
				function(){
					branch.forkIDs.push( $(this).attr('target') );
					branch.forkLabels.push( $(this).text() );
				}
			);
			branches.push( branch );
			var branchDepthParts = branch.id.split('.');
			if( branchDepthParts.length > maxDepth ){
				maxDepth = branchDepthParts.length;
			}
	});
	sliderWidth = windowWidth * maxDepth;
	$('#tree-slider').width( sliderWidth + slideDifferential );
    // reset button handling
    var resetText = $(xmlData).find('resetText').text();
    if(resetText.length > 0){
        var resetIcon = document.createElement('span');
        $(resetIcon).html('&nbsp;').addClass('glyphicon glyphicon-refresh');
        $('#tree-reset').html(resetText).prepend(resetIcon);
    } else {
        $('#tree-reset').addClass('hidden');
    }

    // page title handling
    var pageTitle = $(xmlData).find('title').text();
    $('#page-title').text(pageTitle);
    $('head title').text(pageTitle);
	showBranch( 1 );
}

function resetActionLinks(){
	$('.decision-links a').unbind( 'click' );
	$('a.back-link').unbind( 'click' );
	
	$('.decision-links a').click( function(e){
		if( !$(this).attr('href') ){
			showBranch( $(this).attr('id') );
		}
	});
	$('a.back-link').click( function(){
		$('#tree-window').scrollTo( '-=' + windowWidth + 'px', { axis:'x', duration:slideTime, easing:'easeInOutExpo' } );
		$(this).parent().fadeOut( slideTime, function(){
			$(this).remove();
		});
	});
}

function showBranch( id ){
	for(i = 0; i < branches.length; i++ ){
		if( branches[i].id == id ){
			var currentBranch = branches[i];
			break;
		}
	}
	var decisionLinksHTML = '<div class="decision-links">';
	for( d = 0; d < currentBranch.forkIDs.length; d++ ){
		var link = '';
		var forkContent = $(treeData).find('branch[id="' + currentBranch.forkIDs[d] + '"]').find('content').text();
		if( forkContent.indexOf('http://') == 0 || forkContent.indexOf('https://') == 0 ){
			link = 'href="' + forkContent + '"'
		}
		decisionLinksHTML += '<a ' + link + ' id="' + currentBranch.forkIDs[d] + '" class="btn btn-primary">' + currentBranch.forkLabels[d] + '</a><br/><br/>';
	}
	decisionLinksHTML += '</div>';
	var branchHTML = '<div id="branch-' + currentBranch.id + '" class="tree-content-box"><div class="content lead">' + currentBranch.content + '</div>' + decisionLinksHTML;
	if( currentBranch.id != 1 ){
		branchHTML += '<a class="back-link btn btn-danger">&laquo; Back</a>';
	}
	branchHTML += '</div>';
	$('#tree-slider').append( branchHTML );
	resetActionLinks();
	if( currentBranch.id != 1 ){
		$('#tree-window').scrollTo( '+=' + windowWidth + 'px', { axis:'x', duration:slideTime, easing:'easeInOutExpo' } );
	}
	// add last-child class for IE
	$('.decision-links a:last').addClass( 'last-child' );
}


/*
Useful timer functions used for menu mouseout delays
Source: http://www.codingforums.com/showthread.php?t=10531
*/
function Timer(){
    this.obj = (arguments.length)?arguments[0]:window;
    return this;
}

// The set functions should be called with:
// - The name of the object method (as a string) (required)
// - The millisecond delay (required)
// - Any number of extra arguments, which will all be
//   passed to the method when it is evaluated.

Timer.prototype.setInterval = function(func, msec){
    var i = Timer.getNew();
    var t = Timer.buildCall(this.obj, i, arguments);
    Timer.set[i].timer = window.setInterval(t,msec);
    return i;
}
Timer.prototype.setTimeout = function(func, msec){
    var i = Timer.getNew();
    Timer.buildCall(this.obj, i, arguments);
    Timer.set[i].timer = window.setTimeout("Timer.callOnce("+i+");",msec);
    return i;
}

// The clear functions should be called with
// the return value from the equivalent set function.

Timer.prototype.clearInterval = function(i){
    if(!Timer.set[i]) return;
    window.clearInterval(Timer.set[i].timer);
    Timer.set[i] = null;
}
Timer.prototype.clearTimeout = function(i){
    if(!Timer.set[i]) return;
    window.clearTimeout(Timer.set[i].timer);
    Timer.set[i] = null;
}

// Private data

Timer.set = new Array();
Timer.buildCall = function(obj, i, args){
    var t = "";
    Timer.set[i] = new Array();
    if(obj != window){
        Timer.set[i].obj = obj;
        t = "Timer.set["+i+"].obj.";
    }
    t += args[0]+"(";
    if(args.length > 2){
        Timer.set[i][0] = args[2];
        t += "Timer.set["+i+"][0]";
        for(var j=1; (j+2)<args.length; j++){
            Timer.set[i][j] = args[j+2];
            t += ", Timer.set["+i+"]["+j+"]";
    }}
    t += ");";
    Timer.set[i].call = t;
    return t;
}
Timer.callOnce = function(i){
    if(!Timer.set[i]) return;
    eval(Timer.set[i].call);
    Timer.set[i] = null;
}
Timer.getNew = function(){
    var i = 0;
    while(Timer.set[i]) i++;
    return i;
}
