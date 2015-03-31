window.onload = function(){

	var icon = document.getElementsByTagName('div')[0];

	icon.addEventListener('click', function(){

		if(this.className.indexOf('state-close') === -1){
			this.className = this.className + ' state-close';
		}
		else{
			this.className = this.className + ' state-menu';
		}

		
	});

};