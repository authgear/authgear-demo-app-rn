#import "AppDelegate.h"

#import <RCTAppDelegate.h>
#import <React/RCTBundleURLProvider.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <AGAuthgearReactNative.h>

@implementation ReactNativeDelegate

- (NSURL *_Nullable)sourceURLForBridge:(nonnull RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.reactNativeDelegate = [ReactNativeDelegate new];
  self.reactNativeFactory = [[RCTReactNativeFactory alloc] initWithDelegate:self.reactNativeDelegate];
  self.reactNativeDelegate.dependencyProvider = [RCTAppDependencyProvider new];
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  [self.reactNativeFactory startReactNativeWithModuleName:@"AuthgearDemoAppRN"
                                                 inWindow:self.window
                                        initialProperties:@{}
                                            launchOptions:launchOptions];
  return true;
}

- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options
{
  if ([self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:url]) {
    return YES;
  }
  return NO;
}

@end
