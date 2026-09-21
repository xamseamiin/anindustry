import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("keystore.properties")
if (keystorePropertiesFile.exists()) {
    keystorePropertiesFile.inputStream().use(keystoreProperties::load)
}

android {
    namespace = "com.anindustry.staff"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.anindustry.staff"
        minSdk = 26
        targetSdk = 35
        versionCode = 100
        versionName = "1.0.0"
        // Set with -PAN_INDUSTRY_BASE_URL=https://staff.example.com.
        // This is a public HTTPS URL, never a password, token or database URL.
        val appBaseUrl = providers.gradleProperty("AN_INDUSTRY_BASE_URL")
            .orElse("https://YOUR-AN-INDUSTRY-DOMAIN")
            .get()
            .trimEnd('/')
        buildConfigField("String", "STAFF_PORTAL_URL", "\"$appBaseUrl/staff\"")
        buildConfigField("String", "PAYMENT_BRIDGE_URL", "\"$appBaseUrl/api/staff/payment-bridge/incoming\"")
    }

    signingConfigs {
        if (keystorePropertiesFile.exists()) {
            create("release") {
                storeFile = rootProject.file(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            if (keystorePropertiesFile.exists()) signingConfig = signingConfigs.getByName("release")
        }
    }

    buildFeatures { buildConfig = true }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    testImplementation("junit:junit:4.13.2")
}
