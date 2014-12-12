(function(W, D){

    var DragSlide = function( options ){

        var initOptions = {
            ele : "dragSlide",
            beforeDrag : function(){},
            draging : function(){},
            endDrag : function(){},
            X : 0,
            Y : 0,
            previousEleY : 0,
            currentEleY : 0,   //当前的Y轴坐标
            movedY : 0,        // touch移动的距离
            touchStartY : 0,
            isAnimating : false,
            touchStartTime : 0,
            touchEndTime: 0,
	        move : 100,
            up : true,         //向上拖动
            pageYPrevious: 0,  // 上一次拖动的距离
            distanceY : 0,      // 中断slide拖动效果的目标距离
            pullRefresh : true
        };

        var RAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };

        var utils = {

            deepClone : function( source, detination  ){  /****************对象   深度拷贝*********************/
                for( var property in source ){
                    if( source[property] && source[property].constructor && source[property].constructor ===  Object ){
                        detination[property] = detination[property] || {};
                        arguments.callee( detination[property], source[property] );
                    }else{
                        detination[property] = source[property];
                    }
                }
                return detination;
            },
            ease : {
                quadratic: {
                    style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        fn: function(k) {
                        return k * (2 - k);
                    }
                },
                circular: {
                    style: 'cubic-bezier(0.1, 0.57, 0.1, 1)', // Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
                        fn: function(k) {
                        return Math.sqrt(1 - (--k * k));
                    }
                },
                back: {
                    style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        fn: function(k) {
                        var b = 4;
                        return (k = k - 1) * k * ((b + 1) * k + b) + 1;
                    }
                },
                bounce: {
                    style: '',
                        fn: function(k) {
                        if ((k /= 1) < (1 / 2.75)) {
                            return 7.5625 * k * k;
                        } else if (k < (2 / 2.75)) {
                            return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
                        } else if (k < (2.5 / 2.75)) {
                            return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
                        } else {
                            return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
                        }
                    }
                },
                elastic: {
                    style: '',
                        fn: function(k) {
                        var f = 0.22,
                            e = 0.4;

                        if (k === 0) {
                            return 0;
                        }
                        if (k == 1) {
                            return 1;
                        }

                        return (e * Math.pow(2, -10 * k) * Math.sin((k - f / 4) * (2 * Math.PI) / f) + 1);
                    }
                }
            },
            getTime : Date.now || function getTime() {
                return new Date().getTime();
            },
            translate : function(x,y){
                element.setAttribute("style", "-webkit-transform: translate3d(" + x + "px," + y + "px,0);");
            },
            eleTranslate : function( x, y, ele ){
                if( 'setAttribute' in ele && ele ){
                    ele.setAttribute("style", "-webkit-transform: translate3d(" + x + "px," + y + "px,0);");
                }
            },
            getMovedDistance : function(){
                return parseInt( element.getAttribute( "data-move" ) );
            },
            setCurrentY : function( data ){
                return element.setAttribute( "data-current-y" , data );
            },
            getCurrentY : function(){
                return element.getAttribute( "data-current-y" );
            },
            getEleHeight : function( element ){
                return parseInt( window.getComputedStyle( element ).height || element.offsetHeight  || element.clientHeight );
            },
            getWindowHeight: function(){
                return parseInt( document.documentElement.clientHeight );
            },
            animate: function( destX, destY, duration, easingFn ) {

                var self = this,
                    startX = options.X ,
                    startY = options.currentEleY ,
                    startTime = this.getTime();
                    destTime = startTime + duration
                    gap = self.getWindowHeight() - self.getEleHeight( element );

                easingFn =  self.ease.circular.fn;

                options.distanceY = destY;

                function step(){
                     var now = self.getTime(),
                         newX, newY, easing, endY;


                     if( now >= destTime ){

                         options.isAnimating = false;
                         var isEleHeightMore = ( self.getEleHeight( element ) > self.getWindowHeight() );

                         if( self.getMovedDistance() >  0 ){

                             self.animate( 0, 0, 800 );
                             element.setAttribute( "data-move", 0 );

                         }else if( self.getMovedDistance() < 0 ){

                             if( !isEleHeightMore ){
                                 self.animate( 0, 0, 800 );
                                 element.setAttribute( "data-move", 0 );
                             }else{

                                  if( self.getCurrentY() < gap ){

                                     if( !options.toBottom ){
                                         options.toBottom = true;
                                         self.animate( 0, gap, 800 );
                                         element.setAttribute( "data-move", gap );
                                         setTimeout( function(){ options.toBottom = false; }, 850 );
                                     }

                                 }

                             }

//                             self.translate( destX, destY );
                         }

                         options.endDrag();
                         return;
                     }

                     now = ( now - startTime ) / duration;
                     easing = easingFn( now );
                     newX = ( destX - startX ) * easing + startX;
                     newY = ( destY - startY ) * easing + startY;
                     endY = newY <= 0 ? Math.ceil( newY ) : Math.floor( newY );
//                     console.log( " now : " + now + " easing : " + easing + " newX : " + newX + " newY : " + newY );

                     self.translate( newX, endY );
                     self.setCurrentY( endY );

                    if( options.isAnimating ){
                        RAF( step );
                    }
                }

                options.isAnimating = true;
                step();

            },
            getClassElement : function( data ){
                return document.getElementsByClassName( data ) ? document.getElementsByClassName( data ) : null;
            }
        };

        options = options || {};
        options = utils.deepClone( initOptions, options );

        var element = D.getElementById( options.ele );
        element.setAttribute( "data-move", 0 );
        element.setAttribute( "data-current-y", 0 );

        if( options.pullRefresh ){

            var loadingWrapDiv = document.createElement( "div"),
                loadingSpan = document.createElement( "span"),
                loading = document.createElement( "span" ),
                loadingUp = document.createElement( "span" ),
                loadingDown = document.createElement( "span" ),
                loadingCharacter = document.createElement( "span" );

            loadingWrapDiv.setAttribute( "class", "loading-content-wrap" );
            loading.setAttribute( "class", "loading spin" );
            loadingCharacter.setAttribute( "class", "loadingContent" );
            loadingUp.setAttribute( "class", "loadingUp" );
            loadingDown.setAttribute( "class", "loadingDown" );
            loadingCharacter.innerHTML = "下拉刷新";
            loadingUp.innerHTML = "&uarr;";
            loadingDown.innerHTML = "&darr;";
            loadingSpan.appendChild( loading );
            loadingSpan.appendChild( loadingUp );
            loadingSpan.appendChild( loadingDown );
            loadingWrapDiv.appendChild( loadingSpan );
            loadingWrapDiv.appendChild( loadingCharacter );

            element.parentNode.insertBefore( loadingWrapDiv, element.parentNode.childNodes[0] );

            utils.getClassElement( "loadingUp" )[0].style.display = "none";
            utils.getClassElement( "loading" )[0].style.display = "none";
            utils.eleTranslate( 0, -(utils.getEleHeight( loadingWrapDiv )),  loadingWrapDiv );
            loadingWrapDiv.style.display = "none";
        }

        this.run = function( destX, destY, duration, easingFn ){
            utils.animate( destX, destY, duration, easingFn );
            return this;
        };

        this.events = ['touchstart', 'touchmove', 'touchend'];

        this.init = function(){

            var self = this;

            element.addEventListener( self.events[0], function(event){
                options.beforeDrag();
                if (! event.touches.length) return;
                var touch = event.touches[0];
                options.touchStartY = touch.pageY;
                options.previousEleY = parseInt( element.getAttribute( "data-move" ) );
                options.touchStartTime = utils.getTime();
                options.isAnimating = false;
                element.setAttribute( "data-move", element.getAttribute( "data-current-y" ) );
            }, false );

            D.getElementById( options.ele ).addEventListener( self.events[1], function(event){
                options.draging();
                if (! event.touches.length) return;
                var touch = event.touches[0];
                options.pageYPrevious = touch.pageY;
                var y = options.movedY = touch.pageY - options.touchStartY;
                var endY =  options.previousEleY + y;
                console.log( "touch.pageY : " + touch.pageY + " y: " + y );
                element.setAttribute("style", "-webkit-transform: translate3d(0," + endY + "px,0);");
                element.setAttribute( "data-current-y", endY );
            }, false );

            D.getElementById( options.ele ).addEventListener( self.events[2], function(event){

                options.touchEndTime = utils.getTime();
                var touch = event.changedTouches[0];

                options.movedY = touch.pageY - options.touchStartY;

                if(  options.movedY >= 20 ){
                    options.up = false;
                }else if(  options.movedY <= -20 ){
                    options.up = true;
                }

                var end = options.currentEleY = options.previousEleY + options.movedY,
                    endTiem = options.touchEndTime - options.touchStartTime,
                    endMove = 0,
                    movedYABC = Math.abs( options.movedY ),
                    movingY = parseInt( element.getAttribute( "data-current-y" )),
                    bottomDistance = utils.getWindowHeight() - utils.getEleHeight( element ) ;

                console.log( "options.touchStartY : " + options.touchStartY + " options.pageYPrevious: " +  options.pageYPrevious +  " options.movedY : " + options.movedY + " movedYABC : " + movedYABC + " options.up : " + options.up + " endTiem : " + endTiem );

                if( endTiem > 1000  && movedYABC > 20  ){
                    endMove = options.up ? ( 0 - (options.move / ( 1 + endTiem / 1000 )) ): (options.move / ( 1 + endTiem / 1000 ));
                    utils.animate( 0, ( end + endMove), 300  );
                    element.setAttribute( "data-move", ( end + endMove ) );
                    options.currentEleY = end + endMove;
                    console.log(  "options.move : " + endMove );
                    return;
                }else if( endTiem > 300  && movedYABC > 20  ){
                    endMove = options.up ? ( 0 - ( options.move * ( 200 - endTiem ) / 100 ) ) : ( options.move * ( 200 - endTiem ) / 100 );
                    utils.animate( 0, ( end + endMove), 500  );
                    element.setAttribute( "data-move", ( end + endMove ) );
                    options.currentEleY = end + endMove;
                    console.log( "options.move : " + endMove );
                    return;
                }else if( endTiem > 100 && movedYABC > 20 ){
                    endMove = options.up ? ( 0-( options.move * ( 400 - endTiem ) / 100 * Math.abs( options.movedY ) / 100 ) ) : ( options.move * ( 400 - endTiem ) / 100 );
                    utils.animate( 0, ( end + endMove), 600  );
                    element.setAttribute( "data-move", ( end + endMove ) );
                    options.currentEleY = end + endMove;
                    console.log( "options.move : " + endMove );
                    return;
                }else if( endTiem < 100 && movedYABC > 20 ){

                    if( movingY > 0 ){
                        utils.animate( 0, 0, 500  );
                        element.setAttribute( "data-move", 0 );
                        options.currentEleY = 0;
                        console.log( "options.move : " + 0 );
                    }else{
                        utils.animate( 0, bottomDistance, 500  );
                        element.setAttribute( "data-move", bottomDistance );
                        options.currentEleY = bottomDistance;
                        console.log( "options.move : " + bottomDistance );
                    }
                    return;
                }else if( endTiem > 50 && movedYABC >= 0 && movedYABC <= 20 ){

                    if( utils.getCurrentY() > 0 ){
                        utils.animate( 0, 0, 500  );
                        element.setAttribute( "data-move", 0 );
                        options.currentEleY = 0;
                    }else if( utils.getCurrentY() <  bottomDistance ){
                        utils.animate( 0, bottomDistance, 500  );
                        element.setAttribute( "data-move", bottomDistance );
                        options.currentEleY = bottomDistance;
                    }

                }

            }, false );

            return this;

        };
    }

    window.DragSlide = DragSlide;

})(window,document);