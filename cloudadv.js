var nowLoading, gameWindow, gameBackground, messageText, characterText, selectablesCollection, selectables, paragraph, message, messagePos, messageTimer, passedRoute, step, trans, transTimer, useBg;		//各種グローバル変数の宣言
function getRoute(routeId){					//ルートのXML文章を取得
	step = -1;								//ルートの何段落めか。クリックですすめるごとにひとつ増える
	if (routeId==0){						//初期化
		gameWindow = document.getElementById("gameWindow");							//ゲーム全体の領域
		messageText = document.getElementById("messageText");						//メッセージの表示領域
		characterText = document.getElementById("characterText");					//キャラクター名の表示領域
		gameBackgrounds = document.getElementById("gameBackgrounds").getElementsByTagName("div");	//背景の表示領域x2
		selectablesCollection = document.getElementById("selectablesCollection");	//選択股の表示領域
		useBg=0;								//トランジションのための表示領域の切り替えパラメータ
		passedRoute = new Array(512);			//通過したルートを保存
	}
	nowLoading = true;							//通信中やトランジション中にtrueにする
	var request = new XMLHttpRequest();			//通信準備
	request.open("GET", "./route/route"+routeId+".xml", true);					//読み込むルートの指定
	request.send(null);							//通信開始
	request.onreadystatechange = function(){	//通信状態変化時に呼ばれる匿名関数
		if (request.readyState == 4){			//受信終了ならば
			paragraph = request.responseXML.getElementsByTagName("Paragraph");	//段落ごとに分ける
			passedRoute[0] = routeId;			//現在のルートID
			passedRoute[routeId] = true;		//このルートを通過済みにする
			selectablesCollection.style.display = "none";						//選択肢を非表示にする
			gameWindow.onmousedown = new Function("doAction(-1);");					//クリックで文章を進められるようにする
			nowLoading = false;					//読み込みが終わったので、通信終了に設定
			doAction(-1);						//話をすすめる
		}
	}
}
function doAction(act){		
	if (nowLoading == true);				//読み込み中なら何もしない					//何かしらの動作をさせる
	else if (messageTimer != null)					//メッセージが流れている状態だったら
		messagePos = 512;						//全部表示させる。（実際の文字数より大きい値を入れる）
	else if (act==-1){							//話を進める
		messageText.innerHTML = "";				//メッセージを空にする
		var type = paragraph[++step].getElementsByTagName("Type")[0].firstChild;		//段落を進め、現在位置の表示タイプを取得
		if (type != null)						//省略されていなければ
			type = type.nodeValue;				//タイプを取得
		if (type == "Message" || type == null)	//タイプが「Message」か省略されていれば
			apperMessage(paragraph[step]);		//メッセージ表示
		else if (type == "Jump")				//「Jump」ならば
			getRoute(parseInt(paragraph[step].getElementsByTagName("NextRoute")[0].firstChild.nodeValue));//指定されたルートにジャンプ
		else if (type == "SelectableJump")		//「SelectableJump」（選択肢）ならば
			apperSelectable(paragraph[step]);	//選択肢表示
		else if (type == "PassedRouteJump"){	//「PassedRouteJump」（条件分岐）ならば
			var passed = paragraph[step].getElementsByTagName("PassedRoute");			//どのルートが通過済みか、の条件を取得
			for(i=0; i<passed.length; i++)		//すべての条件に対して
				if ( passedRoute[ parseInt(passed[i].firstChild.nodeValue) ] != true){	//通過してなければ
					doAction(-1);				//話を進める
					return;
				}
			getRoute(parseInt(paragraph[step].getElementsByTagName("NextRoute")[0].firstChild.nodeValue));	//満たしてればジャンプ
		}
	}else					//選択肢クリックならば
		getRoute( act );	//その選択肢が指定したルートにジャンプ
}
function apperMessage(paragraph){						//メッセージ表示
	var character = paragraph.getElementsByTagName("Character");			//「Character」（キャラ名）のデータを取得
	var bgpicture = paragraph.getElementsByTagName("BGPicture");			//「BGPicture」（背景画像）のデータを取得
	var message = paragraph.getElementsByTagName("Message")[0].firstChild.nodeValue;				//「Message」の内容を取得
	if (character[0].firstChild != null)				//「Character」の内容があれば
		characterText.innerHTML = character[0].firstChild.nodeValue;	//キャラ名を表示する
	if (bgpicture[0].firstChild != null){				//「BGPicture」の内容があれば
		nowLoading = true;								//通信・トランジション中に設定
		var imgElement = document.createElement("img");	//画像を表示するパーツを作成
		imgElement.src = "./bgpicture/"+bgpicture[0].firstChild.nodeValue;	//読み込む画像を設定
		gameBackgrounds[1-useBg].replaceChild(imgElement,gameBackgrounds[1-useBg].firstChild);	//現在の背景表示位置に表示
		imgElement.onload = function(){ 				//画像が読み込まれたら実行
			trans=0;									//不透明度を0にする（完全に透明にする）
			transTimer = setInterval(function(){		//定期的に実行され、トランジションを実行する
					gameBackgrounds[1].style.opacity = Math.abs( 1.0*useBg - 1.0*trans/10 );		//うまいことフェードさせる
					if (trans++>=10){					//不透明度を上げ、終わっていれば
						useBg = (useBg+1)%2;			//次回の背景表示位置をチェンジする
						clearInterval(transTimer);		//定期的な実行を終了する
						nowLoading = false;				//通信・トランジション終了に設定
					}
			},50);	//50ミリ秒ごとに実行する
		};
	}
	messagePos = 0;								//メッセージを流れるように表示したい、最初に出ている文字数は0
	messageTimer = setInterval(function(){							//定期的に実行され、文字を流す
		messageText.innerHTML = message.substring(0,messagePos);	//指定の文字数分だけ表示する。
		if (nowLoading == false && messagePos++ >= message.length){	//トランジションしてなければ、文字数を増やし、最後まで達したら
			clearInterval(messageTimer);		//定期的な実行を終了する
			messageTimer = null;				//文字流し終了を設定、変数の使い回しである
		}
	},30);	//30ミリ秒ごとに実行
}
function apperSelectable(paragraph){								//選択肢を表示
	selectables = paragraph.getElementsByTagName("Selectable");		//「Selectable」（選択肢）の情報を取得
	selectablesCollection.innerHTML = "";							//表示中の選択肢を削除
	for(i=0; i<selectables.length; i++){							//すべての選択肢に対して
		var nextRoute = parseInt(selectables[i].getElementsByTagName("NextRoute")[0].firstChild.nodeValue);	//次のルートを取得
		if (passedRoute[nextRoute] != true){						//まだ通過してないルートだったら
			var message = selectables[i].getElementsByTagName("Message")[0].firstChild.nodeValue;			//選択肢のメッセージを取得
			selectablesCollection.innerHTML += "<div class=\"select\"><a href=\"javascript:void(0);\" onclick=\"doAction("+nextRoute+");\">"+message+"</a></div>";	//選択肢を、クリックすると次のルートのIDを伝えるように設定して、書きこむ
		}
	}
	gameWindow.onclick = null;						//選択肢以外のクリックを無効化
	selectablesCollection.style.display = "block";	//選択肢を表示
}