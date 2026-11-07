import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../auth/AuthProvider";
import {
  confirmAvatarUpload, createAvatarUpload, deleteMyAvatar, getMyProfile,
  requestEmailChange, updateMyProfile, type MyProfile,
} from "../services/profileApi";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function contentTypeForAsset(asset: ImagePicker.ImagePickerAsset, blobType: string): "image/jpeg" | "image/png" | "image/webp" | null {
  const candidate = (asset.mimeType || blobType || "").toLowerCase();
  if (candidate === "image/jpeg" || candidate === "image/png" || candidate === "image/webp") return candidate;
  const uri = asset.uri.toLowerCase();
  if (uri.endsWith(".jpg") || uri.endsWith(".jpeg")) return "image/jpeg";
  if (uri.endsWith(".png")) return "image/png";
  if (uri.endsWith(".webp")) return "image/webp";
  return null;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, apiRequest, syncAccount } = useAuth();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const result = await getMyProfile(apiRequest);
      setProfile(result); setDisplayName(result.account.displayName ?? "");
      syncAccount({ ...result.account, avatarUrl: result.avatarUrl, avatarUpdatedAt: result.avatarUpdatedAt });
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "We couldn't load your profile."); }
    finally { setLoading(false); }
  }, [apiRequest, syncAccount]);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  const saveName = async () => {
    if (!displayName.trim()) { setError("Enter a display name."); return; }
    setBusy(true); setError(null); setMessage(null);
    try {
      const result = await updateMyProfile(apiRequest, displayName.trim());
      if (profile) syncAccount({ ...result.account, avatarUrl: profile.avatarUrl, avatarUpdatedAt: profile.avatarUpdatedAt });
      else syncAccount(result.account);
      setMessage("Your display name has been saved.");
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "We couldn't save your profile."); }
    finally { setBusy(false); }
  };

  const chooseAvatar = async () => {
    setError(null); setMessage(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError("Allow photo-library access to choose a profile picture."); return; }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.9,
    });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    setBusy(true);
    try {
      const localResponse = await fetch(asset.uri);
      const blob = await localResponse.blob();
      const contentType = contentTypeForAsset(asset, blob.type);
      if (!contentType) throw new Error("Choose a JPEG, PNG or WebP image. HEIC and other formats are not supported yet.");
      const sizeBytes = asset.fileSize ?? blob.size;
      if (!Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_AVATAR_BYTES) {
        throw new Error("Choose an image no larger than 2 MB.");
      }
      const ticket = await createAvatarUpload(apiRequest, contentType, sizeBytes);
      const uploaded = await fetch(ticket.uploadUrl, { method: "PUT", headers: ticket.headers, body: blob });
      if (!uploaded.ok) throw new Error(`The image upload failed (HTTP ${uploaded.status}). Check MinIO connectivity and CORS settings.`);
      const updated = await confirmAvatarUpload(apiRequest, ticket.uploadId);
      setProfile(updated);
      syncAccount({ ...updated.account, avatarUrl: updated.avatarUrl, avatarUpdatedAt: updated.avatarUpdatedAt });
      setMessage("Your profile picture has been updated.");
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "We couldn't upload this image."); }
    finally { setBusy(false); }
  };

  const removeAvatar = async () => {
    setBusy(true); setError(null); setMessage(null);
    try {
      const updated = await deleteMyAvatar(apiRequest);
      setProfile(updated);
      syncAccount({ ...updated.account, avatarUrl: null, avatarUpdatedAt: null });
      setMessage("Your profile picture has been removed.");
    } catch (removeError) { setError(removeError instanceof Error ? removeError.message : "We couldn't remove your picture."); }
    finally { setBusy(false); }
  };

  const submitEmailChange = async () => {
    if (!newEmail.trim() || !currentPassword) { setError("Enter your new email address and current password."); return; }
    setBusy(true); setError(null); setMessage(null);
    try {
      const result = await requestEmailChange(apiRequest, currentPassword, newEmail.trim());
      setMessage(result.message); setCurrentPassword(""); setNewEmail("");
    } catch (emailError) { setError(emailError instanceof Error ? emailError.message : "We couldn't request the email change."); }
    finally { setBusy(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={22} color="#174EA6"/><Text style={styles.backText}>Back</Text></Pressable>
        <Text style={styles.eyebrow}>ACCOUNT</Text>
        <Text accessibilityRole="header" style={styles.title}>Profile</Text>
        <Text style={styles.description}>Manage your personal details and profile picture.</Text>

        {loading ? <View style={styles.card}><ActivityIndicator color="#174EA6"/><Text style={styles.helper}>Loading profile…</Text></View> : null}
        {!loading && profile ? <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Profile picture</Text>
            <View style={styles.avatarRow}>
              {profile.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatar}/> : <View style={styles.avatarFallback}><Ionicons name="person" size={42} color="#174EA6"/></View>}
              <View style={styles.avatarActions}>
                <Pressable accessibilityRole="button" disabled={busy} onPress={() => void chooseAvatar()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Choose picture</Text></Pressable>
                {profile.avatarUrl ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => void removeAvatar()} style={styles.textButton}><Text style={styles.textButtonText}>Remove picture</Text></Pressable> : null}
              </View>
            </View>
            <Text style={styles.helper}>JPEG, PNG or WebP. Maximum size: 2 MB.</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal details</Text>
            <Text style={styles.label}>Display name</Text>
            <TextInput accessibilityLabel="Display name" editable={!busy} maxLength={100} onChangeText={setDisplayName} style={styles.input} value={displayName}/>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void saveName()} style={[styles.primaryButton, busy && styles.disabled]}><Text style={styles.primaryButtonText}>Save profile</Text></Pressable>
            <Text style={styles.label}>Email address</Text>
            <View style={styles.readOnly}><Text style={styles.readOnlyText}>{profile.account.email ?? "No email address"}</Text><Text style={profile.account.emailVerified ? styles.verified : styles.unverified}>{profile.account.emailVerified ? "Verified" : "Not verified"}</Text></View>
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Change email address</Text>
            <Text style={styles.helper}>A verification link will be sent to the new address. Your current email stays active until you verify the new one.</Text>
            <Text style={styles.label}>New email address</Text>
            <TextInput accessibilityLabel="New email address" autoCapitalize="none" autoCorrect={false} editable={!busy} keyboardType="email-address" onChangeText={setNewEmail} placeholder="name@example.com" style={styles.input} value={newEmail}/>
            <Text style={styles.label}>Current password</Text>
            <TextInput accessibilityLabel="Current password for email change" editable={!busy} onChangeText={setCurrentPassword} secureTextEntry style={styles.input} value={currentPassword}/>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void submitEmailChange()} style={[styles.primaryButton, busy && styles.disabled]}><Text style={styles.primaryButtonText}>Send verification link</Text></Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push("/security")} style={styles.securityLink}><Ionicons name="shield-checkmark-outline" size={22} color="#174EA6"/><Text style={styles.securityLinkText}>Password and signed-in devices</Text><Ionicons name="chevron-forward" size={22} color="#64748B"/></Pressable>
        </> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {!loading && !profile ? <Pressable accessibilityRole="button" onPress={() => void loadProfile()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Try again</Text></Pressable> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page:{flexGrow:1,backgroundColor:"#F8FAFC",padding:20,paddingTop:28,paddingBottom:40},content:{width:"100%",maxWidth:620,alignSelf:"center",gap:13},back:{flexDirection:"row",alignItems:"center",alignSelf:"flex-start",gap:4,minHeight:42},backText:{color:"#174EA6",fontSize:16,fontWeight:"700"},eyebrow:{color:"#174EA6",fontSize:12,fontWeight:"800",letterSpacing:1.3},title:{fontSize:30,lineHeight:38,fontWeight:"800",color:"#172B4D"},description:{fontSize:16,lineHeight:24,color:"#52657A",marginBottom:5},card:{backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#DFE7F0",borderRadius:17,padding:17,gap:11},sectionTitle:{fontSize:19,lineHeight:26,fontWeight:"800",color:"#172B4D"},avatarRow:{flexDirection:"row",alignItems:"center",gap:16},avatar:{width:92,height:92,borderRadius:46,backgroundColor:"#EAF2FF"},avatarFallback:{width:92,height:92,borderRadius:46,backgroundColor:"#EAF2FF",alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:"#C6D9F5"},avatarActions:{flex:1,alignItems:"flex-start",gap:8},primaryButton:{minHeight:48,paddingHorizontal:16,borderRadius:11,backgroundColor:"#174EA6",alignItems:"center",justifyContent:"center",alignSelf:"stretch"},primaryButtonText:{fontSize:16,fontWeight:"800",color:"#FFFFFF"},textButton:{minHeight:38,justifyContent:"center",paddingHorizontal:5},textButtonText:{fontSize:15,color:"#A12B24",fontWeight:"700"},helper:{fontSize:13,lineHeight:19,color:"#65788D"},label:{fontSize:15,lineHeight:22,fontWeight:"700",color:"#243B53",marginTop:3},input:{minHeight:50,borderWidth:1.5,borderColor:"#B8C7D9",borderRadius:10,paddingHorizontal:12,color:"#172B4D",fontSize:16,backgroundColor:"#FFFFFF"},readOnly:{minHeight:48,borderWidth:1,borderColor:"#DFE7F0",borderRadius:10,paddingHorizontal:12,alignItems:"center",justifyContent:"space-between",flexDirection:"row",gap:12,backgroundColor:"#F6F8FB"},readOnlyText:{flex:1,color:"#52657A",fontSize:15},verified:{color:"#16734A",fontWeight:"800",fontSize:13},unverified:{color:"#996515",fontWeight:"800",fontSize:13},securityLink:{minHeight:58,borderWidth:1,borderColor:"#D5E1EF",borderRadius:13,backgroundColor:"#FFFFFF",paddingHorizontal:14,flexDirection:"row",alignItems:"center",gap:11},securityLinkText:{flex:1,color:"#174EA6",fontSize:16,fontWeight:"800"},error:{color:"#B42318",fontSize:15,lineHeight:22},message:{color:"#16734A",fontSize:15,lineHeight:22},disabled:{opacity:0.65},
});
