.PHONY: npm-ci
npm-ci:
	npm ci

.PHONY: pod-install
pod-install:
	cd ./ios; bundle exec pod install

.PHONY: ios-build-app
ios-build-app:
	bundle exec fastlane ios ios_build_app CURRENT_PROJECT_VERSION:$(shell date +%s)

.PHONY: ios-upload-app
ios-upload-app:
	bundle exec fastlane ios ios_upload_app
